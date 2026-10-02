'use client';

import React from 'react';
import { Search, X, RefreshCcw, Filter, Calendar, DollarSign, UserCheck } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusTrip: string;
  onStatusTripChange: (val: string) => void;
  statusPayment: string;
  onStatusPaymentChange: (val: string) => void;
  finishMonth: string;
  onFinishMonthChange: (val: string) => void;
  finishYear?: string;
  onFinishYearChange?: (val: string) => void;
  pic: string;
  onPicChange: (val: string) => void;
  onResetFilters: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
}

const NAMA_BULAN = [
  { val: '1', label: 'Januari' },
  { val: '2', label: 'Februari' },
  { val: '3', label: 'Maret' },
  { val: '4', label: 'April' },
  { val: '5', label: 'Mei' },
  { val: '6', label: 'Juni' },
  { val: '7', label: 'Juli' },
  { val: '8', label: 'Agustus' },
  { val: '9', label: 'September' },
  { val: '10', label: 'Oktober' },
  { val: '11', label: 'November' },
  { val: '12', label: 'Desember' },
];

export default function FilterBar({
  search,
  onSearchChange,
  statusTrip,
  onStatusTripChange,
  statusPayment,
  onStatusPaymentChange,
  finishMonth,
  onFinishMonthChange,
  finishYear = '2026',
  onFinishYearChange,
  pic,
  onPicChange,
  onResetFilters,
  onRefreshData,
  isLoading,
}: FilterBarProps) {
  const hasActiveFilters =
    search !== '' ||
    statusTrip !== 'all' ||
    statusPayment !== 'all' ||
    finishMonth !== 'all' ||
    pic !== 'all';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
      {/* Baris Atas: Search & Quick Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari ID trip, nama tamu, whatsapp, atau paket..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 border border-rose-500/20 bg-rose-500/10 cursor-pointer transition-all shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-foreground bg-secondary hover:bg-muted border border-border/80 transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Baris Bawah: Dropdown Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-border/60">
        {/* Filter Finish Month (Pengakuan Penjualan) */}
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Finish Trip (Bulan)
          </label>
          <select
            value={finishMonth}
            onChange={(e) => onFinishMonthChange(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer truncate"
          >
            <option value="all">Semua Bulan</option>
            {NAMA_BULAN.map((m) => (
              <option key={m.val} value={m.val}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status Trip (Kolom U) */}
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Status Trip (Kolom U)
          </label>
          <select
            value={statusTrip}
            onChange={(e) => onStatusTripChange(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer truncate"
          >
            <option value="all">Semua Status Trip</option>
            <option value="On Schedule (Not Ready)">On Schedule (Not Ready)</option>
            <option value="On Schedule (Ready)">On Schedule (Ready)</option>
            <option value="On Going">On Going (Hari H)</option>
            <option value="Finish (On Review)">Finish (On Review)</option>
            <option value="Finish (Review)">Finish (Review)</option>
          </select>
        </div>

        {/* Filter Status Payment (Kolom AC) */}
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Status Bayar (Kolom AC)
          </label>
          <select
            value={statusPayment}
            onChange={(e) => onStatusPaymentChange(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
          >
            <option value="all">Semua Pembayaran</option>
            <option value="DP 1">DP 1</option>
            <option value="Lunas">Lunas</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>

        {/* Filter PIC */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            PIC Reservasi
          </label>
          <select
            value={pic}
            onChange={(e) => onPicChange(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer truncate"
          >
            <option value="all">Semua PIC</option>
            <option value="dela">Dela</option>
            <option value="alvin">Alvin</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>
      </div>
    </div>
  );
}
