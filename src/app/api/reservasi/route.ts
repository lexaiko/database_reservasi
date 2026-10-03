import { NextRequest, NextResponse } from 'next/server';
import { getAllReservasi, addReservasi, invalidateCache } from '@/lib/googleSheets';
import { ReservasiInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const statusTrip = searchParams.get('statusTrip') || 'all';
    const statusPayment = searchParams.get('statusPayment') || 'all';
    const pic = (searchParams.get('pic') || 'all').toLowerCase();
    const finishMonth = searchParams.get('finishMonth') || 'all'; // Filter penjualan by finish trip
    const finishYear = searchParams.get('finishYear') || 'all';
    const refresh = searchParams.get('refresh') === 'true';

    if (refresh) {
      invalidateCache();
    }

    let list = await getAllReservasi(refresh);

    // Filter Pencarian
    if (search) {
      list = list.filter(
        (r) =>
          r.kode.toLowerCase().includes(search) ||
          r.namaTamu.toLowerCase().includes(search) ||
          r.whatsapp.includes(search) ||
          r.paket.toLowerCase().includes(search)
      );
    }

    // Filter Status Trip
    if (statusTrip !== 'all') {
      list = list.filter((r) => r.computedStatusTrip === statusTrip || r.statusTrip === statusTrip);
    }

    // Filter Status Payment
    if (statusPayment !== 'all') {
      list = list.filter((r) => r.statusPayment === statusPayment);
    }

    // Filter PIC
    if (pic !== 'all') {
      list = list.filter((r) => r.picAgen.toLowerCase() === pic);
    }

    // Filter Finish Trip (Pengakuan Penjualan)
    if (finishMonth !== 'all' || finishYear !== 'all') {
      list = list.filter((r) => {
        const finishYmd = r.finishTrip || r.startTrip;
        if (!finishYmd || !finishYmd.includes('-')) return false;
        const [y, m] = finishYmd.split('-').map(Number);
        if (finishYear !== 'all' && y !== Number(finishYear)) return false;
        if (finishMonth !== 'all' && m !== Number(finishMonth)) return false;
        return true;
      });
    }

    // Sort: Data paling baru (ID/baris tertinggi) di paling atas
    list.sort((a, b) => b.rowNumber - a.rowNumber);

    // Pagination / All Mode
    const getAll = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const total = list.length;

    let paginatedItems = list;
    let totalPages = 1;

    if (!getAll && limit > 0) {
      const startIndex = (page - 1) * limit;
      paginatedItems = list.slice(startIndex, startIndex + limit);
      totalPages = Math.ceil(total / limit);
    }

    return NextResponse.json({
      success: true,
      total,
      page: getAll ? 1 : page,
      limit: getAll ? total : limit,
      totalPages,
      data: paginatedItems,
    });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data reservasi.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ReservasiInput = await req.json();

    if (!body.kode || !body.namaTamu || !body.startTrip) {
      return NextResponse.json(
        { success: false, error: 'Kode, Nama Tamu, dan Start Trip wajib diisi.' },
        { status: 400 }
      );
    }

    // Validasi duplikasi kode
    const existing = await getAllReservasi(false);
    const duplicate = existing.find(
      (r) => r.kode.toLowerCase() === body.kode.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode reservasi '${body.kode}' sudah digunakan oleh tamu '${duplicate.namaTamu}'.`,
        },
        { status: 409 }
      );
    }

    const result = await addReservasi(body);

    return NextResponse.json({
      success: true,
      message: `Reservasi atas nama ${body.namaTamu} (${body.kode}) berhasil disimpan ke Google Sheets!`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error adding reservation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan reservasi.' },
      { status: 500 }
    );
  }
}
