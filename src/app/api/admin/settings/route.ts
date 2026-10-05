import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { invalidateCache } from '@/lib/googleSheets';

export async function GET() {
  try {
    let spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
    let sheetReservasi = process.env.SHEET_RESERVASI || 'Database Reservasi';
    let sheetHpp = process.env.SHEET_HPP || 'RincianHPP';
    let updatedAt = '';
    let updatedBy = '';

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'sheets'));
        if (snap.exists()) {
          const d = snap.data();
          if (d.spreadsheetId) spreadsheetId = d.spreadsheetId;
          if (d.sheetReservasi) sheetReservasi = d.sheetReservasi;
          if (d.sheetHpp) sheetHpp = d.sheetHpp;
          if (d.updatedAt) updatedAt = d.updatedAt;
          if (d.updatedBy) updatedBy = d.updatedBy;
        }
      } catch (firestoreErr) {
        // Fallback aman ke variabel env jika server Firestore rules membatasi read tanpa auth token
        console.warn('[settings route] Firestore read fallback to env:', firestoreErr);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        spreadsheetId,
        sheetReservasi,
        sheetHpp,
        updatedAt,
        updatedBy,
        isFromFirestore: Boolean(updatedAt),
      },
    });
  } catch (err: any) {
    console.error('Error fetching sheet settings:', err);
    return NextResponse.json({
      ok: true,
      data: {
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
        sheetReservasi: process.env.SHEET_RESERVASI || 'Database Reservasi',
        sheetHpp: process.env.SHEET_HPP || 'RincianHPP',
        updatedAt: '',
        updatedBy: '',
        isFromFirestore: false,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { spreadsheetId, sheetReservasi, sheetHpp, updatedBy } = body;

    if (!spreadsheetId || typeof spreadsheetId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Spreadsheet ID wajib diisi.' },
        { status: 400 }
      );
    }

    const payload = {
      spreadsheetId: spreadsheetId.trim(),
      sheetReservasi: (sheetReservasi || 'Database Reservasi').trim(),
      sheetHpp: (sheetHpp || 'RincianHPP').trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database Firestore belum terinisialisasi.' },
        { status: 500 }
      );
    }

    await setDoc(doc(db, 'settings', 'sheets'), payload);
    invalidateCache();

    return NextResponse.json({
      ok: true,
      message: 'Pengaturan Spreadsheet berhasil diperbarui di Cloud Firestore.',
      data: payload,
    });
  } catch (err: any) {
    console.error('Error updating sheet settings:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menyimpan pengaturan sheet' },
      { status: 500 }
    );
  }
}
