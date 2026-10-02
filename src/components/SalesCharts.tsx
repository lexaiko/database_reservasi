'use client';

import React, { useState } from 'react';
import { formatRupiah, formatRibuan } from '@/lib/formatters';
import { BarChart3, Award, Users2, Compass, TrendingUp, Sparkles } from 'lucide-react';
import DonutSumberTamu from '@/components/DonutSumberTamu';

interface SalesChartsProps {
  trenPenjualan: { label: string; bulan: string; revenue: number; pax: number; tripCount: number }[];
  topPaket: { name: string; count: number; revenue: number }[];
  topPic: { name: string; count: number; revenue: number; aov: number }[];
  topSumber?: { name: string; count: number; revenue: number }[];
}

export default function SalesCharts({
  trenPenjualan,
  topPaket,
  topPic,
  topSumber = [],
}: SalesChartsProps) {
  const [activeTrenType, setActiveTrenType] = useState<'revenue' | 'pax'>('revenue');

  // Max value calculation for bar scaling
  const maxTrenVal = Math.max(
    ...trenPenjualan.map((t) => (activeTrenType === 'revenue' ? t.revenue : t.pax)),
    1
  );

  const maxPaketCount = Math.max(...topPaket.map((p) => p.count), 1);
  const maxPicRevenue = Math.max(...topPic.map((p) => p.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      {/* 1. Tren Penjualan Bulanan (Span 2) */}
      <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                Tren Penjualan Bulanan (Finish Trip)
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Pendapatan dihitung menurut jadwal kepulangan tamu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-border/60">
            <button
              onClick={() => setActiveTrenType('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTrenType === 'revenue'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Omset (Rp)
            </button>
            <button
              onClick={() => setActiveTrenType('pax')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTrenType === 'pax'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pax Tamu
            </button>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="h-60 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 overflow-x-auto border-b border-border/60">
          {trenPenjualan.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
              Belum ada data tren finish trip
            </div>
          ) : (
            trenPenjualan.map((item, idx) => {
              const val = activeTrenType === 'revenue' ? item.revenue : item.pax;
              const heightPct = Math.max(8, Math.round((val / maxTrenVal) * 100));

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[44px] flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-foreground text-background text-[11px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg flex flex-col items-center">
                    <span className="font-bold">
                      {activeTrenType === 'revenue' ? formatRupiah(val) : `${val} Pax`}
                    </span>
                    <span className="text-[9px] opacity-80 font-medium">
                      {item.tripCount} Trip
                    </span>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[38px] bg-gradient-to-t from-orange-600 to-amber-500 rounded-t-lg group-hover:brightness-110 transition-all duration-300 shadow-xs"
                  />

                  {/* Label Bulan */}
                  <span className="text-[10px] font-bold text-muted-foreground mt-2 truncate max-w-full">
                    {item.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Top 5 Paket Trip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Award size={16} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground tracking-tight">
              Top 5 Paket Trip
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">Paket paling diminati pemesan</p>
          </div>
        </div>

        <div className="space-y-3.5 my-auto">
          {topPaket.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Belum ada data paket</p>
          ) : (
            topPaket.slice(0, 5).map((p, idx) => {
              const widthPct = Math.round((p.count / maxPaketCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground truncate font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {p.name}
                    </span>
                    <div className="text-right text-[11px] text-muted-foreground shrink-0 ml-2">
                      <strong className="text-foreground font-mono">{p.count} Trip</strong> ({formatRupiah(p.revenue)})
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Performa PIC Reservasi */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users2 size={16} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground tracking-tight">
              Performa PIC Reservasi
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">Omset &amp; Average Order Value</p>
          </div>
        </div>

        <div className="space-y-3 my-auto">
          {topPic.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Belum ada data PIC</p>
          ) : (
            topPic.map((pic, idx) => {
              const widthPct = Math.round((pic.revenue / maxPicRevenue) * 100);
              return (
                <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-foreground">{pic.name}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatRupiah(pic.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{pic.count} Reservasi</span>
                    <span>AOV: <strong className="text-foreground">{formatRupiah(pic.aov)}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Widget Donut Sumber Tamu (CRM Standard) */}
      <DonutSumberTamu data={topSumber} />
    </div>
  );
}
