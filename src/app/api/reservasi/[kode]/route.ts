import { NextRequest, NextResponse } from 'next/server';
import {
  getAllReservasi,
  updateReservasi,
  updateReviewLink,
  getRincianHppByKode,
  deleteReservasi,
} from '@/lib/googleSheets';
import { ReservasiInput } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ kode: string }> }
) {
  try {
    const { kode } = await props.params;
    const all = await getAllReservasi(false);
    const item = all.find((r) => r.kode.toLowerCase() === kode.toLowerCase());

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Data reservasi tidak ditemukan.' },
        { status: 404 }
      );
    }

    const hppData = await getRincianHppByKode(kode);

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        rincianHpp: hppData.items,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ kode: string }> }
) {
  let kode = '';
  try {
    const resolvedParams = await props.params;
    kode = resolvedParams.kode;
    const body = await req.json();

    // Jika hanya quick update link review
    if (body.action === 'update_review') {
      if (!body.linkReview) {
        return NextResponse.json(
          { success: false, error: 'Link review wajib diisi.' },
          { status: 400 }
        );
      }
      await updateReviewLink(kode, body.linkReview);
      return NextResponse.json({
        success: true,
        message: `Link review berhasil disimpan dan status otomatis berubah jadi 'Finish (Review)'!`,
      });
    }

    // Update reservasi lengkap
    await updateReservasi(kode, body as Partial<ReservasiInput>);

    return NextResponse.json({
      success: true,
      message: `Data reservasi ${kode} berhasil diperbarui di Google Sheets!`,
    });
  } catch (error: any) {
    console.error(`Error updating reservation ${kode}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui reservasi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ kode: string }> }
) {
  let kode = '';
  try {
    const resolvedParams = await props.params;
    kode = decodeURIComponent(resolvedParams.kode || '').trim();

    // Ambil header otentikasi role dari request jika ada
    const userRole = req.headers.get('x-user-role') || '';
    if (userRole === 'intern') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Akun Anak Magang (Intern) tidak memiliki hak menghapus data.',
        },
        { status: 403 }
      );
    }

    const res = await deleteReservasi(kode);

    return NextResponse.json({
      success: true,
      message: `Data reservasi ${res.deletedKode} dan rincian HPP terkait berhasil dihapus dari Google Sheets!`,
    });
  } catch (error: any) {
    console.error(`Error deleting reservation ${kode}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus reservasi.' },
      { status: 500 }
    );
  }
}

