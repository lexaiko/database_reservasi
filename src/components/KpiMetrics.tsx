'use client';

import React from 'react';
import { DashboardKpi } from '@/lib/types';
import { formatRupiah, formatRibuan } from '@/lib/formatters';
import {
  Users,
  DollarSign,
  TrendingUp,
  PieChart,
  Lock,
} from 'lucide-react';

interface KpiMetricsProps {
  kpi: DashboardKpi;
  selectedMonthName?: string;
  selectedYear?: string;
  isIntern?: boolean;
}

export default function KpiMetrics({
  kpi,
  selectedMonthName,
  selectedYear = '2026',
  isIntern = false,
}: KpiMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Subheader & Piutang Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Performa Penjualan &amp; Operasional
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/70">
              {selectedMonthName ? `${selectedMonthName} ${selectedYear}` : `Semua Bulan ${selectedYear}`}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards: Susunan 2 di Baris Atas, 3 di Baris Bawah (Responsif 2 Kolom di Mobile) */}
      <div className="space-y-2.5 sm:space-y-4">
        {/* BARIS 1: 2 Card Operasional Utama (Trip Selesai & Total Tamu) */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-4">
          {/* Card 1: Trip Selesai */}
          <div className="p-3 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                Trip Selesai
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight tabular-nums">
                {formatRibuan(kpi.totalPenjualan)}
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 block truncate">
                Trip terverifikasi
              </span>
            </div>
          </div>

          {/* Card 2: Total Tamu */}
          <div className="p-3 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                Total Tamu
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight tabular-nums">
                {formatRibuan(kpi.totalPax)}
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 block truncate">
                Peserta trip terlayani
              </span>
            </div>
          </div>
        </div>

        {/* BARIS 2: 3 Card Keuangan & Profitabilitas (Omset Penjualan, Gross Profit, Gross Margin) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Card 3: Omset Penjualan */}
          <div className="p-3 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                Omset Penjualan
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div
                title={formatRupiah(kpi.totalRevenue)}
                className="font-heading font-black text-[11px] min-[480px]:text-sm sm:text-xl lg:text-2xl xl:text-3xl tracking-tight text-foreground tabular-nums leading-snug"
              >
                {formatRupiah(kpi.totalRevenue)}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 block">
                Nilai order diakui
              </span>
            </div>
          </div>

          {/* Card 4: Gross Profit */}
          <div className="p-3 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                Gross Profit
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                {isIntern ? <Lock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
            </div>
            <div>
              {isIntern ? (
                <div>
                  <div className="font-heading font-black text-sm sm:text-base text-muted-foreground tracking-tight">
                    Terkunci
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium mt-0.5 block truncate">
                    Akses khusus PIC &amp; Superadmin
                  </span>
                </div>
              ) : (
                <div>
                  <div
                    title={formatRupiah(kpi.grossProfit)}
                    className="font-heading font-black text-[11px] min-[480px]:text-sm sm:text-xl lg:text-2xl xl:text-3xl text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums leading-snug"
                  >
                    {formatRupiah(kpi.grossProfit)}
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 block truncate">
                    Beban HPP: {formatRupiah(kpi.totalHpp)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Gross Margin */}
          <div className="col-span-2 md:col-span-1 p-3 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                Gross Margin
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                {isIntern ? <Lock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
            </div>
            <div>
              {isIntern ? (
                <div>
                  <div className="font-heading font-black text-sm sm:text-base text-muted-foreground tracking-tight">
                    Terkunci
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium mt-0.5 block truncate">
                    Akses khusus PIC &amp; Superadmin
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight tabular-nums">
                      {kpi.grossMargin.toFixed(1)}%
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {kpi.grossMargin >= 25 ? 'Profitabel' : 'Margin Tipis'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, kpi.grossMargin))}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-1.5 block">
                    Rasio laba kotor terhadap omset
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
