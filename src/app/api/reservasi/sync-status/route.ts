import { NextResponse } from 'next/server';
import { syncComputedTripStatuses } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await syncComputedTripStatuses();
    return NextResponse.json({
      success: true,
      message: `Berhasil sinkronisasi status trip! ${result.updatedCount} baris diperbarui ke Google Sheets.`,
      updatedCount: result.updatedCount,
    });
  } catch (error: any) {
    console.error('Error syncing trip statuses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal sinkronisasi status trip.' },
      { status: 500 }
    );
  }
}
