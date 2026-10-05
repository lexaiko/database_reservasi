'use client';

import React, { useMemo } from 'react';
import { Calendar, RotateCcw, UserCheck, Lock } from 'lucide-react';
import { formatDateDisplay } from '@/lib/formatters';
import { DateRangePicker } from '@/components/DateRangePicker';

interface DashboardDateFilterProps {
  startDate: string;
  endDate: string;
  pic: string;
  onDateChange: (start: string, end: string) => void;
  onPicChange: (pic: string) => void;
  onReset: () => void;
  picList?: string[];
  totalSalesCount?: number;
  isPicLocked?: boolean;
  isNonPicAdmin?: boolean;
  allowedPics?: string[];
}

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  startDate,
  endDate,
  pic,
  onDateChange,
  onPicChange,
  onReset,
  picList = [],
  totalSalesCount,
  isPicLocked = false,
  isNonPicAdmin = false,
  allowedPics = [],
}) => {
  // Preset calculations
  const presets = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed
    const d = now.getDate();

    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (yearNum: number, monthNum: number, dayNum: number) =>
      `${yearNum}-${pad(monthNum + 1)}-${pad(dayNum)}`;

    const today = toYMD(y, m, d);

    // 7 Hari Terakhir
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 6);
    const last7DaysStart = toYMD(d7.getFullYear(), d7.getMonth(), d7.getDate());

    // Bulan Ini (Oktober)
    const currentMonthStart = `${y}-${pad(m + 1)}-01`;
    const lastDayCurrentMonth = new Date(y, m + 1, 0).getDate();
    const currentMonthEnd = `${y}-${pad(m + 1)}-${pad(lastDayCurrentMonth)}`;

    // Bulan Lalu (September)
    const prevMonthDate = new Date(y, m - 1, 1);
    const prevY = prevMonthDate.getFullYear();
    const prevM = prevMonthDate.getMonth();
    const lastDayPrevMonth = new Date(prevY, prevM + 1, 0).getDate();
    const prevMonthStart = `${prevY}-${pad(prevM + 1)}-01`;
    const prevMonthEnd = `${prevY}-${pad(prevM + 1)}-${pad(lastDayPrevMonth)}`;

    return {
      today,
      last7DaysStart,
      currentMonthStart,
      currentMonthEnd,
      prevMonthStart,
      prevMonthEnd,
    };
  }, []);

  const hasActiveFilter = Boolean(startDate) || Boolean(endDate) || (!isPicLocked && pic !== 'all');

  // Label periode aktif untuk teks ringkasan
  const activePeriodLabel = useMemo(() => {
    if (startDate && endDate) {
      if (startDate === presets.currentMonthStart && endDate === presets.currentMonthEnd) {
        return 'Bulan Ini (Oktober 2026)';
      }
      if (startDate === presets.prevMonthStart && endDate === presets.prevMonthEnd) {
        return 'Bulan Lalu (September 2026)';
      }
      if (startDate === presets.last7DaysStart && endDate === presets.today) {
        return '7 Hari Terakhir';
      }
      if (startDate === presets.today && endDate === presets.today) {
        return 'Hari Ini';
      }
      return `${formatDateDisplay(startDate)} s/d ${formatDateDisplay(endDate)}`;
    }
    return 'Seluruh Tahun 2026';
  }, [startDate, endDate, presets]);

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 sm:space-y-4">
      {/* 1. Header Bar: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Title & Subtitle */}
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
              <Calendar size={16} />
            </div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              Filter Rentang Waktu Dashboard
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            <span>
              Menampilkan periode:{' '}
              <strong className="text-foreground">{activePeriodLabel}</strong>
              {pic !== 'all' && (
                <span>
                  {' '}
                  • PIC: <strong className="text-orange-600 capitalize">{pic}</strong>
                </span>
              )}
              {isNonPicAdmin && pic === 'all' && allowedPics && allowedPics.length > 0 && (
                <span>
                  {' '}
                  • Sekat Diizinkan:{' '}
                  <strong className="text-primary">{allowedPics.join(', ')}</strong>
                </span>
              )}
              {totalSalesCount !== undefined && (
                <span> ({totalSalesCount} trip)</span>
              )}
            </span>
          </p>
        </div>

        {/* Right: Controls (Single Unified DateRangePicker, PIC Lock/Selector, Reset) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Single Unified DateRangePicker */}
          <div className="flex-1 sm:flex-initial min-w-0">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                onDateChange(start, end);
              }}
              presetType={
                !startDate && !endDate
                  ? 'ALL'
                  : startDate === presets.currentMonthStart && endDate === presets.currentMonthEnd
                  ? 'THIS_MONTH'
                  : startDate === presets.prevMonthStart && endDate === presets.prevMonthEnd
                  ? 'LAST_MONTH'
                  : startDate === presets.last7DaysStart && endDate === presets.today
                  ? 'WEEK'
                  : startDate === presets.today && endDate === presets.today
                  ? 'TODAY'
                  : 'CUSTOM'
              }
            />
          </div>

          {/* PIC Selector / Lock Display */}
          {isPicLocked ? (
            <div
              className="flex items-center gap-1.5 bg-muted/60 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs select-none h-9 shrink-0"
              title="PIC dikunci sesuai hak akses akun Anda"
            >
              <Lock size={12} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">PIC:</span>
              <span className="text-xs font-bold text-foreground capitalize truncate max-w-[80px] sm:max-w-none">{pic || '-'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-2xs h-9 shrink-0">
              <UserCheck size={13} className="text-muted-foreground shrink-0" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {isNonPicAdmin ? 'Sekat:' : 'PIC:'}
              </span>
              <select
                value={pic}
                onChange={(e) => onPicChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer capitalize"
              >
                <option value="all">
                  {isNonPicAdmin ? 'Semua Sekat Diizinkan' : 'Semua PIC'}
                </option>
                {picList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs h-9 shrink-0"
              title="Reset ke semua waktu"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDateFilter;
