import { NextRequest, NextResponse } from 'next/server';
import {
  getRincianHppByKode,
  getMasterKategoriHpp,
  saveHpp,
} from '@/lib/googleSheets';
import { StatusPayment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kode = searchParams.get('kode');
    const getMaster = searchParams.get('master') === 'true';

    if (getMaster) {
      const master = await getMasterKategoriHpp();
      return NextResponse.json({ success: true, data: master });
    }

    if (!kode) {
      return NextResponse.json(
        { success: false, error: 'Parameter kode wajib disertakan.' },
        { status: 400 }
      );
    }

    const data = await getRincianHppByKode(kode);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching HPP:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data HPP.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kode, namaTamu, items, statusPayment } = body;

    if (!kode || !namaTamu) {
      return NextResponse.json(
        { success: false, error: 'Kode dan Nama Tamu wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await saveHpp(
      kode,
      namaTamu,
      items || [],
      statusPayment as StatusPayment
    );

    return NextResponse.json({
      success: true,
      message: `HPP untuk ${namaTamu} (${kode}) berhasil disimpan! Total: Rp ${result.totalHpp.toLocaleString('id-ID')}`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error saving HPP:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan data HPP.' },
      { status: 500 }
    );
  }
}
