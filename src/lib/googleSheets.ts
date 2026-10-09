import { google } from 'googleapis';
import path from 'path';
import {
  Reservasi,
  ReservasiInput,
  HppItem,
  MasterKategoriHpp,
  DashboardKpi,
  SalesFilterOptions,
  StatusTrip,
  StatusPayment,
} from './types';
import {
  computeTripStatus,
  computePaymentStatus,
  normalizeDateToYMD,
  formatDateDisplay,
  parseCurrency,
  parseMargin,
  computeMargin,
} from './formatters';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 menit cache in-memory untuk efisiensi
const cache: Map<string, { data: any; expiresAt: number }> = new Map();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached(key: string, data: any, ttl = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

let dynamicSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
let dynamicSheetReservasi = process.env.SHEET_RESERVASI || 'Database Reservasi';
let dynamicSheetHpp = process.env.SHEET_HPP || 'RincianHPP';
let lastFetchedConfig = 0;

export async function refreshSheetConfigFromFirestore(force = false): Promise<void> {
  if (!force && Date.now() - lastFetchedConfig < 60000 && dynamicSpreadsheetId) {
    return;
  }
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'settings', 'sheets'));
      if (snap.exists()) {
        const d = snap.data();
        if (d.spreadsheetId) dynamicSpreadsheetId = d.spreadsheetId;
        if (d.sheetReservasi) dynamicSheetReservasi = d.sheetReservasi;
        if (d.sheetHpp) dynamicSheetHpp = d.sheetHpp;
        lastFetchedConfig = Date.now();
      }
    }
  } catch (e) {
    // Fallback diam ke env jika gagal baca Firestore
  }
}

export function invalidateCache(keyPrefix?: string): void {
  lastFetchedConfig = 0;
  if (keyPrefix) {
    for (const k of cache.keys()) {
      if (k.startsWith(keyPrefix)) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}

export function getSpreadsheetId(): string {
  const id = dynamicSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID env var / Firestore settings tidak diset.');
  return id;
}

export const SHEET_NAMES = {
  get reservasi() {
    return dynamicSheetReservasi || process.env.SHEET_RESERVASI || 'Database Reservasi';
  },
  get hpp() {
    return dynamicSheetHpp || process.env.SHEET_HPP || 'RincianHPP';
  },
};

export function getSheetsAuth() {
  // 1. Prioritas Vercel Serverless / Production via Environment Variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (e) {
      console.warn('Gagal parse GOOGLE_SERVICE_ACCOUNT_KEY dari env, fallback ke file lokal:', e);
    }
  }

  // 2. Prioritas Lokal via service-account.json
  const keyFilePath = path.join(process.cwd(), 'service-account.json');
  return new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsService() {
  const auth = getSheetsAuth();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Format tanggal input YYYY-MM-DD menjadi DD/MM/YY untuk penulisan ke Google Sheets
 */
function toSheetDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  const ymd = normalizeDateToYMD(dateStr);
  if (!ymd || !ymd.includes('-')) return dateStr;
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y.substring(2)}`;
}

/**
 * Ambil semua data reservasi dari sheet "Database Reservasi"
 */
export async function getAllReservasi(forceRefresh = false): Promise<Reservasi[]> {
  await refreshSheetConfigFromFirestore(forceRefresh);
  const cacheKey = 'all_reservasi';
  if (!forceRefresh) {
    const cached = getCached<Reservasi[]>(cacheKey);
    if (cached) return cached;
  }

  const sheets = getSheetsService();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `'${SHEET_NAMES.reservasi}'!A2:AG`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = res.data.values || [];
  const list: Reservasi[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const kode = String(r[0] || '').trim();
    if (!kode) continue; // Abaikan baris kosong

    const rowNumber = idx + 2; // Baris nyata di Google Sheets (header di baris 1)
    const namaTamu = String(r[1] || '').trim();
    const whatsapp = String(r[2] || '').trim();
    const instagram = String(r[3] || '').trim();
    const tiktok = String(r[4] || '').trim();
    const startTrip = normalizeDateToYMD(r[5]);
    const finishTrip = normalizeDateToYMD(r[6]);
    const pax = Number(r[7]) || 0;
    const trip = r[8] !== undefined && r[8] !== null ? r[8] : '';
    const paket = String(r[9] || '').trim();
    const day1 = String(r[10] || '').trim();
    const day2 = String(r[11] || '').trim();
    const day3 = String(r[12] || '').trim();
    const day4 = String(r[13] || '').trim();
    const mepo = String(r[14] || '').trim();
    const hotel = String(r[15] || '').trim();
    const crew = String(r[16] || '').trim();
    const catatan = String(r[17] || '').trim();
    const picAgen = String(r[18] || '').trim();
    const sumberLeads = String(r[19] || '').trim();
    const statusTrip = (String(r[20] || '').trim() || 'On Schedule (Not Ready)') as StatusTrip;
    const linkReview = String(r[21] || '').trim();
    const linkFoto = String(r[22] || '').trim();
    const nilaiOrder = parseCurrency(r[23]);
    const dp = parseCurrency(r[24]);
    const tglDp = normalizeDateToYMD(r[25]);
    const sisaPelunasan = parseCurrency(r[26]);
    const tglPelunasan = normalizeDateToYMD(r[27]);
    const statusPayment = (String(r[28] || '').trim() || 'DP 1') as StatusPayment;
    const notesPayment = String(r[29] || '').trim();
    const hpp = parseCurrency(r[30]);
    let profit = parseCurrency(r[31]);
    let margin = parseMargin(r[32]);

    // Hanya hitung profit & margin jika SUDAH LUNAS dan HPP SUDAH DIISI (> 0)
    const isLunas = statusPayment === 'Lunas';
    const hasHpp = hpp > 0;

    if (isLunas && hasHpp && nilaiOrder > 0) {
      profit = Math.max(0, nilaiOrder - hpp);
      margin = computeMargin(nilaiOrder, hpp);
    } else {
      // Jika belum mengisi HPP atau belum lunas, tidak dihitung profit dulu
      profit = 0;
      margin = 0;
    }

    // Hitung status dinamis
    const computedStatusTrip = computeTripStatus(startTrip, finishTrip, linkReview, statusTrip);
    const { needsHppUpdate } = computePaymentStatus(nilaiOrder, dp, statusPayment);

    list.push({
      rowNumber,
      kode,
      namaTamu,
      whatsapp,
      instagram,
      tiktok,
      startTrip,
      finishTrip,
      pax,
      trip,
      paket,
      day1,
      day2,
      day3,
      day4,
      mepo,
      hotel,
      crew,
      catatan,
      picAgen,
      sumberLeads,
      statusTrip,
      linkReview,
      linkFoto,
      nilaiOrder,
      dp,
      tglDp,
      sisaPelunasan,
      tglPelunasan,
      statusPayment,
      notesPayment,
      hpp,
      profit,
      margin,
      computedStatusTrip,
      needsHppUpdate,
    });
  }

  setCached(cacheKey, list);
  return list;
}

/**
 * Tambah reservasi baru ke Google Sheets
 */
export async function addReservasi(input: ReservasiInput): Promise<{ ok: boolean; rowNumber: number }> {
  await refreshSheetConfigFromFirestore();
  const sheets = getSheetsService();
  const spreadsheetId = getSpreadsheetId();

  // Hitung status awal & sisa
  const nilaiOrder = Math.round(Number(input.nilaiOrder) || 0);
  const dp = Math.round(Number(input.dp) || 0);
  const sisa = Math.max(0, nilaiOrder - dp);

  const initialStatusTrip = input.statusTrip || 'On Schedule (Not Ready)';
  const initialStatusPayment: StatusPayment =
    nilaiOrder > 0 && dp >= nilaiOrder ? 'Lunas' : 'DP 1';

  const startTripFmt = toSheetDateFormat(input.startTrip);
  const finishTripFmt = toSheetDateFormat(input.finishTrip);
  const tglDpFmt = toSheetDateFormat(input.tglDp);

  // Sanitasi pencegahan formula injection
  const sanitize = (v: any) => {
    if (typeof v !== 'string') return v ?? '';
    const str = v.trim();
    if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
    return str;
  };

  // Ambil nomor baris target sebelum insert agar rumus langsung terisi di newRow
  let estimatedRow = 0;
  try {
    const colARes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_NAMES.reservasi}'!A:A`,
    });
    estimatedRow = (colARes.data.values?.length || 0) + 1;
  } catch (err) {
    // Fallback jika gagal hitung baris
  }

  const formulaAA = estimatedRow >= 2 ? `=X${estimatedRow}-Y${estimatedRow}` : sisa;
  const formulaAF = estimatedRow >= 2 ? `=X${estimatedRow}-AE${estimatedRow}` : '';
  const formulaAG = estimatedRow >= 2 ? `=IF(OR(X${estimatedRow}=""; X${estimatedRow}=0); 0; AF${estimatedRow}/X${estimatedRow})` : '';

  // Struktur kolom A sampai AG (33 kolom):
  // A: KODE, B: NAMA TAMU, C: WA, D: IG, E: TIKTOK
  // F: START, G: FINISH, H: PAX, I: TRIP, J: PAKET
  // K: DAY 1, L: DAY 2, M: DAY 3, N: DAY 4
  // O: MEPO (JAM), P: HOTEL (I/E), Q: CREW
  // R: CATATAN, S: PIC/AGEN, T: SUMBER LEADS
  // U: STATUS TRIP, V: LINK REVIEW, W: LINK FOTO
  // X: NILAI ORDER, Y: DP, Z: TGL DP
  // AA: SISA PELUNASAN, AB: TGL PELUNASAN, AC: STATUS PAYMENT
  // AD: NOTES PAYMENT, AE: HPP, AF: PROFIT, AG: MARGIN (%)
  const newRow = [
    sanitize(input.kode),
    sanitize(input.namaTamu),
    sanitize(input.whatsapp || ''),
    sanitize(input.instagram || ''),
    sanitize(input.tiktok || ''),
    startTripFmt,
    finishTripFmt,
    Number(input.pax) || 0,
    input.trip || '',
    sanitize(input.paket),
    sanitize(input.day1 || ''),
    sanitize(input.day2 || ''),
    sanitize(input.day3 || ''),
    sanitize(input.day4 || ''),
    sanitize(input.mepo || ''),      // Kolom O (kosong saat awal masuk jika tidak diisi)
    sanitize(input.hotel || ''),     // Kolom P
    sanitize(input.crew || ''),      // Kolom Q
    sanitize(input.catatan || ''),   // Kolom R
    sanitize(input.picAgen || ''),   // Kolom S
    sanitize(input.sumberLeads || ''),// Kolom T
    initialStatusTrip,               // Kolom U: "On Schedule (Not Ready)"
    sanitize(input.linkReview || ''),// Kolom V
    sanitize(input.linkFoto || ''),  // Kolom W
    nilaiOrder,                      // Kolom X
    dp,                              // Kolom Y
    tglDpFmt,                        // Kolom Z
    formulaAA,                       // Kolom AA: Sisa Pelunasan (Formula)
    '',                              // Kolom AB: Tgl Pelunasan
    initialStatusPayment,            // Kolom AC: "DP 1" atau "Lunas"
    '',                              // Kolom AD: Notes Payment
    '',                              // Kolom AE: HPP (kosong saat awal masuk)
    formulaAF,                       // Kolom AF: Profit (Formula)
    formulaAG,                       // Kolom AG: Margin (%) (Formula)
  ];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${SHEET_NAMES.reservasi}'!A:AG`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [newRow],
    },
  });

  let rowNumber = estimatedRow;
  const updatedRange = appendRes.data.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/) || updatedRange.match(/!A(\d+)$/);
  if (match) {
    rowNumber = parseInt(match[1], 10);
  }

  // Jika nomor baris aktual berbeda dengan estimasi, perbarui formulanya sesuai nomor baris aktual
  if (rowNumber >= 2 && rowNumber !== estimatedRow) {
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `'${SHEET_NAMES.reservasi}'!AA${rowNumber}`,
              values: [[`=X${rowNumber}-Y${rowNumber}`]],
            },
            {
              range: `'${SHEET_NAMES.reservasi}'!AF${rowNumber}:AG${rowNumber}`,
              values: [[`=X${rowNumber}-AE${rowNumber}`, `=IF(OR(X${rowNumber}=""; X${rowNumber}=0); 0; AF${rowNumber}/X${rowNumber})`]],
            },
          ],
        },
      });
    } catch (fmtErr) {
      console.warn(`Gagal menyelaraskan formula otomatis untuk baris ${rowNumber}:`, fmtErr);
    }
  }

  invalidateCache();
  return { ok: true, rowNumber };
}

/**
 * Update data reservasi berdasarkan Kode
 */
export async function updateReservasi(
  kode: string,
  updates: Partial<ReservasiInput>
): Promise<{ ok: boolean }> {
  const all = await getAllReservasi(true);
  const target = all.find((r) => r.kode.toLowerCase() === kode.trim().toLowerCase());
  if (!target) {
    throw new Error(`Data reservasi dengan kode '${kode}' tidak ditemukan.`);
  }

  const sheets = getSheetsService();
  const spreadsheetId = getSpreadsheetId();
  const rowNumber = target.rowNumber;

  const sanitize = (v: any) => {
    if (typeof v !== 'string') return v ?? '';
    const str = v.trim();
    if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
    return str;
  };

  const startTrip = updates.startTrip !== undefined ? toSheetDateFormat(updates.startTrip) : toSheetDateFormat(target.startTrip);
  const finishTrip = updates.finishTrip !== undefined ? toSheetDateFormat(updates.finishTrip) : toSheetDateFormat(target.finishTrip);
  const tglDp = updates.tglDp !== undefined ? toSheetDateFormat(updates.tglDp) : toSheetDateFormat(target.tglDp);

  const nilaiOrder = updates.nilaiOrder !== undefined ? Math.round(Number(updates.nilaiOrder)) : target.nilaiOrder;
  const dp = updates.dp !== undefined ? Math.round(Number(updates.dp)) : target.dp;
  const sisa = Math.max(0, nilaiOrder - dp);

  // Status trip otomatis bila link review terisi
  let statusTrip = updates.statusTrip !== undefined ? updates.statusTrip : target.statusTrip;
  const linkReview = updates.linkReview !== undefined ? updates.linkReview : target.linkReview;
  if (linkReview && linkReview.trim().length > 0 && (!statusTrip || statusTrip.includes('Finish') || statusTrip.includes('Schedule'))) {
    statusTrip = 'Finish (Review)';
  }

  let statusPayment = updates.statusPayment !== undefined ? updates.statusPayment : target.statusPayment;
  if (nilaiOrder > 0 && dp >= nilaiOrder && statusPayment !== 'Cancel') {
    statusPayment = 'Lunas';
  }

  const profit = Math.max(0, nilaiOrder - target.hpp);
  const margin = nilaiOrder > 0 ? Number(((profit / nilaiOrder) * 100).toFixed(1)) : 0;

  const updatedRow = [
    sanitize(updates.kode || target.kode),
    sanitize(updates.namaTamu || target.namaTamu),
    sanitize(updates.whatsapp !== undefined ? updates.whatsapp : target.whatsapp),
    sanitize(updates.instagram !== undefined ? updates.instagram : target.instagram),
    sanitize(updates.tiktok !== undefined ? updates.tiktok : target.tiktok),
    startTrip,
    finishTrip,
    updates.pax !== undefined ? Number(updates.pax) : target.pax,
    updates.trip !== undefined ? updates.trip : target.trip,
    sanitize(updates.paket || target.paket),
    sanitize(updates.day1 !== undefined ? updates.day1 : target.day1),
    sanitize(updates.day2 !== undefined ? updates.day2 : target.day2),
    sanitize(updates.day3 !== undefined ? updates.day3 : target.day3),
    sanitize(updates.day4 !== undefined ? updates.day4 : target.day4),
    sanitize(updates.mepo !== undefined ? updates.mepo : target.mepo),
    sanitize(updates.hotel !== undefined ? updates.hotel : target.hotel),
    sanitize(updates.crew !== undefined ? updates.crew : target.crew),
    sanitize(updates.catatan !== undefined ? updates.catatan : target.catatan),
    sanitize(updates.picAgen !== undefined ? updates.picAgen : target.picAgen),
    sanitize(updates.sumberLeads !== undefined ? updates.sumberLeads : target.sumberLeads),
    statusTrip,
    sanitize(linkReview),
    sanitize(updates.linkFoto !== undefined ? updates.linkFoto : target.linkFoto),
    nilaiOrder,
    dp,
    tglDp,
    `=X${rowNumber}-Y${rowNumber}`,
    sanitize(target.tglPelunasan),
    statusPayment,
    sanitize(target.notesPayment),
    target.hpp,
    `=X${rowNumber}-AE${rowNumber}`,
    `=IF(OR(X${rowNumber}=""; X${rowNumber}=0); 0; AF${rowNumber}/X${rowNumber})`,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEET_NAMES.reservasi}'!A${rowNumber}:AG${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [updatedRow],
    },
  });

  invalidateCache();
  return { ok: true };
}

/**
 * Update Cepat Link Review dan otomatis ubah Status Trip ke "Finish (Review)"
 */
export async function updateReviewLink(kode: string, linkReview: string): Promise<{ ok: boolean }> {
  return updateReservasi(kode, {
    linkReview,
    statusTrip: 'Finish (Review)',
  });
}

/**
 * Hapus Data Reservasi dari Google Sheets (dan rincian HPP terkait)
 */
export async function deleteReservasi(kode: string): Promise<{ ok: boolean; deletedKode: string }> {
  await refreshSheetConfigFromFirestore();
  const cleanKode = kode.trim().toLowerCase();
  const all = await getAllReservasi(true);
  const target = all.find((r) => r.kode.trim().toLowerCase() === cleanKode);

  if (!target) {
    throw new Error(`Data reservasi dengan kode ${kode} tidak ditemukan.`);
  }

  const sheets = getSheetsService();
  const spreadsheetId = getSpreadsheetId();

  // 1. Dapatkan SheetId (gid) untuk tab Reservasi
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const targetTitle = (SHEET_NAMES.reservasi || 'Database Reservasi').trim().toLowerCase();
  const reservasiSheet = meta.data.sheets?.find((s) => {
    const t = (s.properties?.title || '').trim().toLowerCase();
    return t === targetTitle || t === 'database reservasi' || t === 'reservasi';
  });

  if (!reservasiSheet || reservasiSheet.properties?.sheetId === undefined) {
    throw new Error(`Sheet '${SHEET_NAMES.reservasi}' tidak ditemukan di spreadsheet.`);
  }

  const sheetId = reservasiSheet.properties.sheetId;

  // 2. Hapus baris reservasi dari Google Sheets
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: target.rowNumber - 1, // 0-indexed
              endIndex: target.rowNumber,
            },
          },
        },
      ],
    },
  });

  // 3. Bersihkan rincian HPP milik kode ini jika ada
  try {
    const resHpp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_NAMES.hpp}'!A2:H`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const allHppRows = resHpp.data.values || [];
    const remainingHppRows = allHppRows.filter(
      (r) => String(r[1] || '').trim().toLowerCase() !== cleanKode
    );

    if (remainingHppRows.length !== allHppRows.length) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${SHEET_NAMES.hpp}'!A2:H`,
      });

      if (remainingHppRows.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${SHEET_NAMES.hpp}'!A2:H${remainingHppRows.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: remainingHppRows,
          },
        });
      }
    }
  } catch (hppErr) {
    console.warn(`Peringatan: Gagal membersihkan rincian HPP untuk ${kode}:`, hppErr);
  }

  invalidateCache();
  return { ok: true, deletedKode: target.kode };
}

/**
 * Sinkronisasi Massal Status Trip berdasarkan tanggal Finish Trip & Hari H
 */
export async function syncComputedTripStatuses(): Promise<{ updatedCount: number }> {
  const all = await getAllReservasi(true);
  const sheets = getSheetsService();
  const spreadsheetId = getSpreadsheetId();

  let updatedCount = 0;
  const updates: { range: string; values: any[][] }[] = [];

  for (const item of all) {
    const computed = computeTripStatus(
      item.startTrip,
      item.finishTrip,
      item.linkReview,
      item.statusTrip
    );

    if (computed !== item.statusTrip && item.statusTrip !== 'Cancel') {
      updates.push({
        range: `'${SHEET_NAMES.reservasi}'!U${item.rowNumber}`,
        values: [[computed]],
      });
      updatedCount++;
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });
    invalidateCache();
  }

  return { updatedCount };
}

/**
 * Ambil rincian HPP untuk suatu Kode Reservasi
 */
export async function getRincianHppByKode(kode: string): Promise<{
  items: HppItem[];
  totalHpp: number;
  namaTamu: string;
  statusPayment: string;
}> {
  const cleanKode = kode.trim().toLowerCase();
  const all = await getAllReservasi(false);
  const reservasi = all.find((r) => r.kode.toLowerCase() === cleanKode);

  const sheets = getSheetsService();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `'${SHEET_NAMES.hpp}'!A2:H`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  const items: HppItem[] = [];
  let totalHpp = 0;

  for (const r of rows) {
    const rowKode = String(r[1] || '').trim().toLowerCase();
    if (rowKode === cleanKode) {
      const nominal = parseCurrency(r[5]);
      totalHpp += nominal;
      items.push({
        timestamp: String(r[0] || ''),
        kode: String(r[1] || ''),
        nama: String(r[2] || ''),
        kategori: String(r[3] || ''),
        vendor: String(r[4] || ''),
        nominal,
        catatan: String(r[6] || ''),
        tanggalTrip: String(r[7] || ''),
      });
    }
  }

  return {
    items,
    totalHpp,
    namaTamu: reservasi?.namaTamu || '',
    statusPayment: reservasi?.statusPayment || 'DP 1',
  };
}

/**
 * Ambil daftar Master Kategori & Vendor HPP
 */
export async function getMasterKategoriHpp(): Promise<MasterKategoriHpp> {
  const cacheKey = 'master_kategori_hpp';
  const cached = getCached<MasterKategoriHpp>(cacheKey);
  if (cached) return cached;

  const sheets = getSheetsService();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "'KategoriHPP'!A2:B",
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  const master: MasterKategoriHpp = {};

  for (const r of rows) {
    const kat = String(r[0] || '').trim();
    const ven = String(r[1] || '').trim();
    if (kat) {
      if (!master[kat]) master[kat] = [];
      if (ven && !master[kat].includes(ven)) {
        master[kat].push(ven);
      }
    }
  }

  setCached(cacheKey, master, 10 * 60 * 1000);
  return master;
}

/**
 * Simpan / Update rincian HPP, perbarui master kategori jika ada vendor baru,
 * dan perbarui total HPP di baris Database Reservasi
 */
export async function saveHpp(
  kode: string,
  namaTamu: string,
  items: { kategori: string; vendor: string; nominal: number; catatan?: string }[],
  newStatusPayment?: StatusPayment
): Promise<{ ok: boolean; totalHpp: number }> {
  const cleanKode = kode.trim();
  const sheets = getSheetsService();
  const spreadsheetId = getSpreadsheetId();

  // 1. Ambil seluruh data RincianHPP untuk menghapus rincian lama dari kode ini
  const resHpp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAMES.hpp}'!A2:H`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const allHppRows = resHpp.data.values || [];
  // Simpan baris yang BUKAN milik kode ini
  const remainingRows = allHppRows.filter(
    (r) => String(r[1] || '').trim().toLowerCase() !== cleanKode.toLowerCase()
  );

  // Buat baris-baris baru untuk kode ini
  const now = new Date();
  const nowStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
  let totalHpp = 0;

  const newRows = items.map((item) => {
    const nom = Math.round(Number(item.nominal) || 0);
    totalHpp += nom;
    return [
      nowStr,
      cleanKode,
      namaTamu,
      item.kategori.trim(),
      item.vendor.trim(),
      nom,
      (item.catatan || '').trim(),
      '',
    ];
  });

  // Timpa sheet RincianHPP (A2:H) dengan data tersisa + data baru
  const finalHppData = [...remainingRows, ...newRows];

  // Kosongkan range lama dulu jika barisnya berkurang
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${SHEET_NAMES.hpp}'!A2:H`,
  });

  if (finalHppData.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.hpp}'!A2:H${finalHppData.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: finalHppData,
      },
    });
  }

  // 2. Periksa Master Kategori & Tambahkan vendor baru jika belum ada
  const master = await getMasterKategoriHpp();
  const newMasterAppends: string[][] = [];

  for (const it of items) {
    const k = it.kategori.trim();
    const v = it.vendor.trim();
    if (k && v) {
      if (!master[k] || !master[k].includes(v)) {
        newMasterAppends.push([k, v]);
        if (!master[k]) master[k] = [];
        master[k].push(v);
      }
    }
  }

  if (newMasterAppends.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'KategoriHPP'!A:B",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: newMasterAppends },
    });
    invalidateCache('master_kategori_hpp');
  }

  // 3. Update Kolom HPP (AE) dan Status Payment (AC) di sheet Database Reservasi
  const allReservasi = await getAllReservasi(true);
  const target = allReservasi.find((r) => r.kode.toLowerCase() === cleanKode.toLowerCase());

  if (target) {
    const profit = Math.max(0, target.nilaiOrder - totalHpp);
    const margin = computeMargin(target.nilaiOrder, totalHpp);
    const finalPaymentStatus = newStatusPayment || target.statusPayment;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.reservasi}'!AC${target.rowNumber}:AG${target.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            finalPaymentStatus, // AC: Status Payment
            target.notesPayment || '', // AD: Notes Payment
            totalHpp,           // AE: HPP
            `=X${target.rowNumber}-AE${target.rowNumber}`, // AF: Profit formula
            `=IF(OR(X${target.rowNumber}=""; X${target.rowNumber}=0); 0; AF${target.rowNumber}/X${target.rowNumber})`, // AG: Margin formula
          ],
        ],
      },
    });
  }

  invalidateCache();
  return { ok: true, totalHpp };
}

/**
 * Filter dan Kalkulasi Data Penjualan Eksekutif:
 * KRITIS: Sesuai notulensi user, omset / penjualan DIAKUI BERDASARKAN FINISH TRIP!
 */
export async function getDashboardData(filters?: SalesFilterOptions): Promise<{
  kpi: DashboardKpi;
  trenPenjualan: { label: string; bulan: string; revenue: number; pax: number; tripCount: number }[];
  topPaket: { name: string; count: number; revenue: number }[];
  topPic: { name: string; count: number; revenue: number; aov: number }[];
  topSumber: { name: string; count: number; revenue: number }[];
  outstandingPiutang: Reservasi[];
}> {
  const all = await getAllReservasi(false);

  // Ambil hanya reservasi yang tidak dibatalkan
  const activeReservations = all.filter(
    (r) => r.statusPayment !== 'Cancel' && r.statusTrip !== 'Cancel' && r.statusTrip !== 'Cancel / Refund'
  );

  const selectedMonth = filters?.month && filters.month !== 'all' ? Number(filters.month) : null;
  const selectedYear = filters?.year && filters.year !== 'all' ? Number(filters.year) : 2026;
  const selectedPics = filters?.pic && filters.pic !== 'all'
    ? filters.pic.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean)
    : null;
  const startDate = filters?.startDate && filters.startDate !== 'all' ? filters.startDate : null;
  const endDate = filters?.endDate && filters.endDate !== 'all' ? filters.endDate : null;

  // 1. Filter omset diakui berdasarkan TANGGAL FINISH TRIP (atau START TRIP jika belum terisi)!
  const filteredSales = activeReservations.filter((r) => {
    // Saring PIC jika dipilih (mendukung single atau multi PIC)
    if (selectedPics && selectedPics.length > 0) {
      if (!selectedPics.includes((r.picAgen || '').trim().toLowerCase())) return false;
    }

    // Filter tanggal finish trip (atau start trip jika finish trip kosong)
    const rawTripDate = r.finishTrip || r.startTrip;
    const finishYmd = normalizeDateToYMD(rawTripDate);
    if (!finishYmd || !finishYmd.includes('-')) return false;

    // Jika filter rentang tanggal (startDate / endDate) aktif:
    if (startDate && finishYmd < startDate) return false;
    if (endDate && finishYmd > endDate) return false;

    // Jika TIDAK ADA rentang tanggal spesifik, gunakan filter month & year:
    if (!startDate && !endDate) {
      const [y, m] = finishYmd.split('-').map(Number);
      if (selectedYear && y !== selectedYear) return false;
      if (selectedMonth && m !== selectedMonth) return false;
    }

    return true;
  });

  // 2. Hitung KPI
  let totalRevenue = 0;
  let totalPax = 0;
  let totalHpp = 0;
  let grossProfit = 0;
  let revenueLunasWithHpp = 0;

  for (const r of filteredSales) {
    totalRevenue += r.nilaiOrder;
    totalPax += r.pax;
    if (r.hpp > 0) {
      totalHpp += r.hpp;
    }

    // Hanya hitung profit jika SUDAH LUNAS DAN SUDAH MENGISI HPP
    if (r.statusPayment === 'Lunas' && r.hpp > 0 && r.nilaiOrder > 0) {
      const p = Math.max(0, r.nilaiOrder - r.hpp);
      grossProfit += p;
      revenueLunasWithHpp += r.nilaiOrder;
    }
  }

  // Margin dihitung dari rasio profit terhadap omset reservasi yang sudah lunas & ber-HPP
  const grossMargin = revenueLunasWithHpp > 0
    ? Number(((grossProfit / revenueLunasWithHpp) * 100).toFixed(1))
    : 0;

  // 3. Piutang (semua reservasi yang belum lunas, disaring menurut PIC jika filter PIC aktif)
  const scopedForPiutang = selectedPics && selectedPics.length > 0
    ? activeReservations.filter((r) => selectedPics.includes((r.picAgen || '').toLowerCase()))
    : activeReservations;

  const outstandingPiutang = scopedForPiutang
    .filter((r) => r.statusPayment !== 'Lunas' && r.sisaPelunasan > 0)
    .sort((a, b) => {
      const da = new Date(a.finishTrip || a.startTrip).getTime();
      const db = new Date(b.finishTrip || b.startTrip).getTime();
      return da - db;
    });

  const totalBelumLunas = outstandingPiutang.reduce((acc, cur) => acc + cur.sisaPelunasan, 0);

  // 4. Tren Penjualan Bulanan (Berdasarkan Finish Trip, disaring menurut PIC jika filter PIC aktif)
  const monthlyDataset = selectedPics && selectedPics.length > 0
    ? activeReservations.filter((r) => selectedPics.includes((r.picAgen || '').toLowerCase()))
    : activeReservations;

  const monthlyAgg: Record<string, { revenue: number; pax: number; tripCount: number }> = {};
  for (const r of monthlyDataset) {
    const fYmd = r.finishTrip || r.startTrip;
    if (!fYmd || !fYmd.includes('-')) continue;
    const [y, m] = fYmd.split('-');
    if (Number(y) !== (selectedYear || 2026)) continue;

    const key = `${y}-${m.padStart(2, '0')}`;
    if (!monthlyAgg[key]) monthlyAgg[key] = { revenue: 0, pax: 0, tripCount: 0 };
    monthlyAgg[key].revenue += r.nilaiOrder;
    monthlyAgg[key].pax += r.pax;
    monthlyAgg[key].tripCount += 1;
  }

  const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const sortedMonths = Object.keys(monthlyAgg).sort();
  const trenPenjualan = sortedMonths.map((key) => {
    const [y, m] = key.split('-');
    const mIdx = parseInt(m, 10) - 1;
    const label = `${NAMA_BULAN[mIdx]} ${y.substring(2)}`;
    return {
      label,
      bulan: key,
      revenue: monthlyAgg[key].revenue,
      pax: monthlyAgg[key].pax,
      tripCount: monthlyAgg[key].tripCount,
    };
  });

  // 5. Top 5 Paket
  const paketAgg: Record<string, { count: number; revenue: number }> = {};
  for (const r of filteredSales) {
    const p = r.paket || 'Lainnya';
    if (!paketAgg[p]) paketAgg[p] = { count: 0, revenue: 0 };
    paketAgg[p].count += 1;
    paketAgg[p].revenue += r.nilaiOrder;
  }
  const topPaket = Object.keys(paketAgg)
    .map((name) => ({ name, count: paketAgg[name].count, revenue: paketAgg[name].revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 6. Top PIC & AOV
  const picAgg: Record<string, { count: number; revenue: number }> = {};
  for (const r of filteredSales) {
    const pic = r.picAgen || 'Belum Ada PIC';
    if (!picAgg[pic]) picAgg[pic] = { count: 0, revenue: 0 };
    picAgg[pic].count += 1;
    picAgg[pic].revenue += r.nilaiOrder;
  }
  const topPic = Object.keys(picAgg)
    .map((name) => {
      const count = picAgg[name].count;
      const revenue = picAgg[name].revenue;
      const aov = count > 0 ? Math.round(revenue / count) : 0;
      return { name, count, revenue, aov };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // 7. Sumber Leads
  const sumberAgg: Record<string, { count: number; revenue: number }> = {};
  for (const r of filteredSales) {
    const src = r.sumberLeads || 'Belum Tahu';
    if (!sumberAgg[src]) sumberAgg[src] = { count: 0, revenue: 0 };
    sumberAgg[src].count += 1;
    sumberAgg[src].revenue += r.nilaiOrder;
  }
  const topSumber = Object.keys(sumberAgg)
    .map((name) => ({ name, count: sumberAgg[name].count, revenue: sumberAgg[name].revenue }))
    .sort((a, b) => b.count - a.count);

  return {
    kpi: {
      totalPenjualan: filteredSales.length,
      totalPax,
      totalRevenue,
      totalHpp,
      grossProfit,
      grossMargin,
      totalBelumLunas,
      countBelumLunas: outstandingPiutang.length,
    },
    trenPenjualan,
    topPaket,
    topPic,
    topSumber,
    outstandingPiutang: outstandingPiutang.slice(0, 10),
  };
}
