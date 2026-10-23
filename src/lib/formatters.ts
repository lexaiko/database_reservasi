import { StatusTrip, StatusPayment } from './types';

/**
 * Format angka ke format mata uang Rupiah standar Indonesia
 * Cth: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Format angka dengan pemisah ribuan titik tanpa simbol "Rp"
 * Cth: 1500000 -> "1.500.000"
 */
export function formatRibuan(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('id-ID');
}

/**
 * Membersihkan format string uang menjadi number murni
 * Cth: "50.000.000" -> 50000000, "1.500.000" -> 1500000, "Rp 500.000" -> 500000
 */
export function parseCurrency(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  let str = String(val).trim();
  const isNegative = str.startsWith('-') || str.includes('(');

  // Bersihkan prefiks Rp / IDR jika ada
  str = str.replace(/^(Rp\.?|IDR)\s*/i, '').trim();

  // Hapus sen desimal jika berupa ,00 atau .00 di akhir
  str = str.replace(/[,.]00$/, '');

  // Jika ada koma desimal pecahan (misal 1500,50 atau 1250,5)
  if (/,\d{1,2}$/.test(str)) {
    const withoutThousands = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(withoutThousands);
    return isNaN(num) ? 0 : isNegative ? -Math.round(num) : Math.round(num);
  }

  // Hilangkan semua karakter non-digit
  const rawDigits = str.replace(/\D/g, '');
  if (!rawDigits) return 0;
  const num = parseInt(rawDigits, 10);
  return isNegative ? -num : num;
}

/**
 * Normalisasi format tanggal input ke string YYYY-MM-DD
 */
export function normalizeDateToYMD(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Jika serial number Excel (contoh: 46023)
  if (typeof val === 'number') {
    const utcDays = val - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  // Cek format DD/MM/YY atau DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let y = parts[2];
      if (y.length === 2) y = `20${y}`;
      return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  // Cek format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  return str;
}

/**
 * Format tanggal ke tampilan user-friendly (DD/MM/YY)
 */
export function formatDateDisplay(val: any): string {
  const ymd = normalizeDateToYMD(val);
  if (!ymd || !ymd.includes('-')) return String(val || '-');
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y.substring(2)}`;
}

/**
 * Hitung Status Trip otomatis berdasarkan aturan:
 * 1. Default baru: "On Schedule (Not Ready)"
 * 2. Hari H (start_trip <= today <= finish_trip): "On Going"
 * 3. Finish trip selesai (today > finish_trip): "Finish (On Review)" atau "Finish (Un Review)"
 * 4. Link review terisi: "Finish (Review)"
 */
export function computeTripStatus(
  startTrip: string,
  finishTrip: string,
  linkReview?: string,
  currentStatus?: string
): StatusTrip {
  if (currentStatus === 'Cancel' || currentStatus === 'Cancel / Refund') {
    return currentStatus;
  }

  // Jika link review sudah diisi
  if (linkReview && linkReview.trim().length > 0) {
    return 'Finish (Review)';
  }

  const startYmd = normalizeDateToYMD(startTrip);
  const finishYmd = normalizeDateToYMD(finishTrip || startTrip);

  if (!startYmd) {
    return currentStatus || 'On Schedule (Not Ready)';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  startDate.setHours(0, 0, 0, 0);

  let finishDate = startDate;
  if (finishYmd) {
    const [fy, fm, fd] = finishYmd.split('-').map(Number);
    finishDate = new Date(fy, fm - 1, fd);
    finishDate.setHours(23, 59, 59, 999);
  }

  // Hari H (Sedang berjalan)
  if (today.getTime() >= startDate.getTime() && today.getTime() <= finishDate.getTime()) {
    return 'On Going';
  }

  // Sudah selesai tapi review belum diisi
  if (today.getTime() > finishDate.getTime()) {
    return 'Finish (On Review)';
  }

  // Belum mulai
  if (currentStatus && currentStatus.includes('Ready')) {
    return currentStatus;
  }
  return 'On Schedule (Not Ready)';
}

/**
 * Hitung Status Pembayaran:
 * - Awal masuk jika DP < Harga: "DP 1"
 * - Jika DP == Harga (atau terbayar >= harga): "Lunas"
 */
export function computePaymentStatus(
  nilaiOrder: number,
  dp: number,
  currentStatus?: string
): { status: StatusPayment; needsHppUpdate: boolean } {
  if (currentStatus === 'Cancel' || currentStatus === 'Cancel / Refund') {
    return { status: currentStatus, needsHppUpdate: false };
  }

  const order = Math.round(Number(nilaiOrder) || 0);
  const paid = Math.round(Number(dp) || 0);

  let status: StatusPayment = 'DP 1';
  let needsHppUpdate = false;

  if (order > 0 && paid >= order) {
    status = 'Lunas';
  } else if (currentStatus && currentStatus !== 'DP 1') {
    status = currentStatus as StatusPayment;
  }

  if (paid > order && order > 0) {
    needsHppUpdate = true;
  }

  return { status, needsHppUpdate };
}

/**
 * Parse persentase margin dari Google Sheets (misal: "34,6%", "55.8%", 0.346, 34.6)
 * Mengembalikan angka persentase dengan 1 desimal (cth: 34.6)
 */
export function parseMargin(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    // Jika format decimal murni dari Sheets unformatted (cth: 0.346 -> 34.6%)
    if (val > 0 && val <= 1) {
      return Number((val * 100).toFixed(1));
    }
    return Number(val.toFixed(1));
  }

  const str = String(val).replace('%', '').trim().replace(',', '.');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1 && !String(val).includes('%')) {
    return Number((num * 100).toFixed(1));
  }
  return Number(num.toFixed(1));
}

/**
 * Menghitung persentase margin sesuai rumus di Google Sheet:
 * =ARRAYFORMULA(IF(A2:A="";"";IF(LEN(AE2:AE);IFERROR((X2:X-AE2:AE)/X2:X;0);0)))
 * 
 * Aturan Bisnis:
 * - Jika Nilai Order <= 0: Margin 0%
 * - Jika HPP = 0 (misal DP customer hangus, tanpa pengeluaran vendor): Margin = 100%
 * - Jika HPP > 0: Margin = ((Nilai Order - HPP) / Nilai Order) * 100
 */
export function computeMargin(nilaiOrder: number, hpp: number): number {
  const order = Math.round(Number(nilaiOrder) || 0);
  const cost = Math.max(0, Math.round(Number(hpp) || 0));
  if (order <= 0) return 0;
  const profit = Math.max(0, order - cost);
  const pct = (profit / order) * 100;
  return Number(pct.toFixed(1));
}

