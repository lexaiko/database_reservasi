'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/formatters';
import { PieChart } from 'lucide-react';

interface DonutSumberTamuProps {
  data?: { name: string; count: number; revenue: number }[];
}

const DONUT_COLORS = [
  '#f97316', // Orange (Brand core)
  '#0284c7', // Sky Blue
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export default function DonutSumberTamu({ data = [] }: DonutSumberTamuProps) {
  const [metricMode, setMetricMode] = useState<'count' | 'revenue'>('count');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const activeTotal = metricMode === 'count' ? totalCount : totalRevenue;

  // Donut geometry constants
  const size = 220;
  const center = size / 2;
  const radius = 75;
  const circumference = 2 * Math.PI * radius; // ~471.24
  const gap = data.length > 1 ? 3 : 0;

  // Compute slice coordinates
  let accumulatedLength = 0;
  const slices = data.map((item, idx) => {
    const val = metricMode === 'count' ? item.count : item.revenue;
    const ratio = activeTotal > 0 ? val / activeTotal : 0;
    const rawLength = ratio * circumference;
    const dashLength = Math.max(0, rawLength - gap);
    const strokeOffset = -accumulatedLength;
    accumulatedLength += rawLength;
    const percent = Math.round(ratio * 100);

    return {
      ...item,
      val,
      ratio,
      percent,
      dashLength,
      strokeOffset,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    };
  });

  const activeHoveredItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <PieChart size={16} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground tracking-tight">
              Sumber Tamu (Saluran Akuisisi)
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Distribusi porsi reservasi &amp; omset menurut asal kedatangan tamu
            </p>
          </div>
        </div>

        {/* CRM Metric Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-border/60">
          <button
            type="button"
            onClick={() => setMetricMode('count')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'count'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Volume Trip
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'revenue'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Omset (Rp)
          </button>
        </div>
      </div>

      {/* Body: Donut Chart on Left, Legend & Metrics on Right */}
      {data.length === 0 || activeTotal === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-border flex items-center justify-center text-muted-foreground mb-3">
            <PieChart size={32} className="opacity-40" />
          </div>
          <p className="text-xs font-bold text-muted-foreground">Belum ada data sumber tamu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut SVG Visualizer */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
            <div className="relative w-[220px] h-[220px] flex items-center justify-center">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
              >
                {/* Background Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-muted/40 dark:text-muted/20"
                />

                {/* Donut Slices */}
                {slices.map((slice, idx) => {
                  const isHovered = hoveredIdx === idx;
                  const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                  return (
                    <circle
                      key={idx}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? 26 : 20}
                      strokeDasharray={`${slice.dashLength} ${circumference - slice.dashLength}`}
                      strokeDashoffset={slice.strokeOffset}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`cursor-pointer transition-all duration-300 ${
                        isDimmed ? 'opacity-35' : 'opacity-100'
                      }`}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Focal Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeHoveredItem ? (
                  <div className="animate-fade-in space-y-0.5 max-w-[130px]">
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block truncate max-w-full"
                      style={{
                        backgroundColor: `${activeHoveredItem.color}20`,
                        color: activeHoveredItem.color,
                      }}
                    >
                      {activeHoveredItem.name}
                    </span>
                    <div className="text-xl font-black text-foreground font-mono leading-tight">
                      {activeHoveredItem.percent}%
                    </div>
                    <div className="text-[11px] font-bold text-muted-foreground truncate">
                      {metricMode === 'count'
                        ? `${activeHoveredItem.count} Trip`
                        : formatRupiah(activeHoveredItem.revenue)}
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-0.5 max-w-[130px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {metricMode === 'count' ? 'Total Trip' : 'Total Omset'}
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-foreground font-mono leading-tight truncate">
                      {metricMode === 'count' ? totalCount : formatRupiah(totalRevenue)}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {data.length} Saluran
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] font-semibold text-muted-foreground mt-3 text-center">
              Arahkan kursor pada donat atau tabel untuk melihat rincian
            </p>
          </div>

          {/* CRM Legend & Breakdown List */}
          <div className="md:col-span-7 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {slices.map((slice, idx) => {
                const isHovered = hoveredIdx === idx;
                const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isHovered
                        ? 'border-primary shadow-xs bg-card ring-1 ring-primary/40'
                        : isDimmed
                        ? 'border-border/50 bg-muted/10 opacity-50'
                        : 'border-border/70 bg-muted/20 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-xs font-bold text-foreground truncate" title={slice.name}>
                          {slice.name}
                        </span>
                      </div>
                      <span
                        className="text-[11px] font-extrabold font-mono px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                          backgroundColor: `${slice.color}15`,
                          color: slice.color,
                        }}
                      >
                        {slice.percent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                      <span className="font-mono text-muted-foreground font-semibold">
                        <strong className="text-foreground">{slice.count}</strong> Trip
                      </span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-[11px]">
                        {formatRupiah(slice.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
