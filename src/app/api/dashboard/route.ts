import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || 'all';
    const year = searchParams.get('year') || '2026';
    const pic = searchParams.get('pic') || 'all';

    const data = await getDashboardData({
      month,
      year,
      pic,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data dashboard.' },
      { status: 500 }
    );
  }
}
