'use client';

import React, { useMemo } from 'react';
import { Calendar, Filter, RotateCcw, ChevronRight, UserCheck, Lock } from 'lucide-react';
import { formatDateDisplay } from '@/lib/formatters';

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
}

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  startDate,
  endDate,
  pic,
  onDateChange,
  onPicChange,
  onReset,
  picList = ['Dela', 'Bagas', 'Kikik', 'Bobi', 'Dio'],
  totalSalesCount,
  isPicLocked = false,
}) => {
  // Helpers for preset calculation
  const presets = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed
    const d = now.getDate();

    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (year: number, month: number, day: number) =>
      `${year}-${pad(month + 1)}-${pad(day)}`;

    // Hari Ini
    const today = toYMD(y, m, d);

    // 7 Hari Terakhir
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 6);
    const last7DaysStart = toYMD(d7.getFullYear(), d7.getMonth(), d7.getDate());

    // 30 Hari Terakhir
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 29);
    const last30DaysStart = toYMD(d30.getFullYear(), d30.getMonth(), d30.getDate());

    // Bulan Ini
    const thisMonthStart = toYMD(y, m, 1);
    const lastDayThisMonth = new Date(y, m + 1, 0).getDate();
    const thisMonthEnd = toYMD(y, m, lastDayThisMonth);

    // Bulan Lalu
    const lastMonthDate = new Date(y, m - 1, 1);
    const lmY = lastMonthDate.getFullYear();
    const lmM = lastMonthDate.getMonth();
    const lastMonthStart = toYMD(lmY, lmM, 1);
    const lastDayLastMonth = new Date(lmY, lmM + 1, 0).getDate();
    const lastMonthEnd = toYMD(lmY, lmM, lastDayLastMonth);

    // Tahun Ini (2026)
    const thisYearStart = `${y}-01-01`;
    const thisYearEnd = `${y}-12-31`;

    return [
      { id: 'today', label: 'Hari Ini', start: today, end: today },
      { id: '7days', label: '7 Hari Terakhir', start: last7DaysStart, end: today },
      { id: 'thisMonth', label: 'Bulan Ini', start: thisMonthStart, end: thisMonthEnd },
      { id: 'lastMonth', label: 'Bulan Lalu', start: lastMonthStart, end: lastMonthEnd },
      { id: 'thisYear', label: 'Tahun 2026', start: thisYearStart, end: thisYearEnd },
    ];
  }, []);

  const activePreset = presets.find((p) => p.start === startDate && p.end === endDate)?.id;
  const isCustom = !activePreset && (startDate || endDate);
  const hasActiveFilter = startDate || endDate || pic !== 'all';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Section Title & Active Filter Summary */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Calendar size={16} />
            </div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              Filter Rentang Waktu Dashboard
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {startDate && endDate ? (
              <span>
                Menampilkan omset trip diakui periode:{' '}
                <strong className="text-foreground">
                  {formatDateDisplay(startDate)}
                </strong>{' '}
                s/d{' '}
                <strong className="text-foreground">
                  {formatDateDisplay(endDate)}
                </strong>
                {pic !== 'all' && (
                  <span>
                    {' '}
                    • PIC: <strong className="text-orange-600">{pic}</strong>
                  </span>
                )}
                {totalSalesCount !== undefined && (
                  <span> ({totalSalesCount} trip terdata)</span>
                )}
              </span>
            ) : (
              <span>
                Menampilkan seluruh penjualan trip terverifikasi tahun 2026.
              </span>
            )}
          </p>
        </div>

        {/* Right: Date Picker Inputs & PIC Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tanggal Awal */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Dari:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <span className="text-muted-foreground text-xs hidden sm:inline">s/d</span>

          {/* Tanggal Akhir */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Sampai:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          {/* PIC Selector / Lock Display */}
          {isPicLocked ? (
            <div
              className="flex items-center gap-1.5 bg-muted/60 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs select-none"
              title="PIC dikunci sesuai hak akses akun Anda"
            >
              <Lock size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">PIC:</span>
              <span className="text-xs font-bold text-foreground capitalize">{pic || 'Dela'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <UserCheck size={13} className="text-muted-foreground" />
              <select
                value={pic}
                onChange={(e) => onPicChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">Semua PIC</option>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Reset ke semua waktu"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs select-none no-scrollbar">
        <span className="text-[11px] font-bold text-muted-foreground mr-1 shrink-0">
          Preset Cepat:
        </span>
        <button
          type="button"
          onClick={onReset}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            !startDate && !endDate
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
          }`}
        >
          Semua Data (2026)
        </button>

        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onDateChange(p.start, p.end)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {p.label}
            </button>
          );
        })}

        {isCustom && (
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200/60 shrink-0">
            Kustom
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardDateFilter;
