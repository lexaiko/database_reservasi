'use client';

import React from 'react';
import { DashboardKpi } from '@/lib/types';
import { formatRupiah, formatRibuan } from '@/lib/formatters';
import {
  Users,
  Backpack,
  Gem,
  TrendingUp,
  PieChart,
} from 'lucide-react';

interface KpiMetricsProps {
  kpi: DashboardKpi;
  selectedMonthName?: string;
  selectedYear?: string;
}

export default function KpiMetrics({
  kpi,
  selectedMonthName,
  selectedYear = '2026',
}: KpiMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Subheader & Piutang Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Performa Penjualan &amp; Laba Kotor
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/70">
              {selectedMonthName ? `${selectedMonthName} ${selectedYear}` : `Semua Bulan ${selectedYear}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Pendapatan diakui sesuai prinsip akuntansi saat trip selesai (finish trip).
          </p>
        </div>
      </div>

      {/* KPI Cards: Susunan 2 di Baris Atas, 3 di Baris Bawah (Responsif di Mobile) */}
      <div className="space-y-3 sm:space-y-4">
        {/* BARIS 1: 2 Card Operasional Utama (Trip Selesai & Total Tamu) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Trip Selesai */}
          <div className="p-3.5 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Trip Selesai
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums">
                {formatRibuan(kpi.totalPenjualan)}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 block">
                Trip selesai terverifikasi
              </span>
            </div>
          </div>

          {/* Card 2: Total Tamu */}
          <div className="p-3.5 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Tamu
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Backpack className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums">
                {formatRibuan(kpi.totalPax)}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 block">
                Peserta trip terlayani
              </span>
            </div>
          </div>
        </div>

        {/* BARIS 2: 3 Card Keuangan & Profitabilitas (Omset Penjualan, Gross Profit, Gross Margin) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 3: Omset Penjualan */}
          <div className="p-3.5 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Omset Penjualan
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Gem className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div
                title={formatRupiah(kpi.totalRevenue)}
                className="font-heading font-black text-lg sm:text-xl lg:text-2xl xl:text-3xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent truncate tabular-nums"
              >
                {formatRupiah(kpi.totalRevenue)}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 block">
                Nilai order diakui
              </span>
            </div>
          </div>

          {/* Card 4: Gross Profit */}
          <div className="p-3.5 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Estimasi Gross Profit
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div
                title={formatRupiah(kpi.grossProfit)}
                className="font-heading font-black text-lg sm:text-xl lg:text-2xl xl:text-3xl text-emerald-600 dark:text-emerald-400 tracking-tight truncate tabular-nums"
              >
                {formatRupiah(kpi.grossProfit)}
              </div>
              <span className="text-[10px] sm:text-[11px] lg:text-xs text-muted-foreground font-medium mt-1 block truncate">
                Total Beban HPP: {formatRupiah(kpi.totalHpp)}
              </span>
            </div>
          </div>

          {/* Card 5: Gross Margin */}
          <div className="p-3.5 sm:p-4 lg:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all hover:border-primary/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Gross Margin Operasional
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
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
                Rasio laba kotor terhadap omset terverifikasi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
