import { NextRequest, NextResponse } from 'next/server';
import { syncComputedTripStatuses } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verifikasi request berasal dari Vercel Cron (bukan sembarang pihak)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncComputedTripStatuses();
    console.log(`[CRON] Auto-sync selesai: ${result.updatedCount} baris diperbarui.`);

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Auto-sync gagal:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
