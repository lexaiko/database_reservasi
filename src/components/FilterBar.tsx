'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  RefreshCcw,
  SlidersHorizontal,
  Calendar,
  CreditCard,
  UserCheck,
  Compass,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

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
  isPicLocked?: boolean;
  picList?: string[];
  isLoading: boolean;
}

const NAMA_BULAN = [
  { val: '1', short: 'Jan', label: 'Januari' },
  { val: '2', short: 'Feb', label: 'Februari' },
  { val: '3', short: 'Mar', label: 'Maret' },
  { val: '4', short: 'Apr', label: 'April' },
  { val: '5', short: 'Mei', label: 'Mei' },
  { val: '6', short: 'Jun', label: 'Juni' },
  { val: '7', short: 'Jul', label: 'Juli' },
  { val: '8', short: 'Ags', label: 'Agustus' },
  { val: '9', short: 'Sep', label: 'September' },
  { val: '10', short: 'Okt', label: 'Oktober' },
  { val: '11', short: 'Nov', label: 'November' },
  { val: '12', short: 'Des', label: 'Desember' },
];

const QUICK_STATUS_TRIP = [
  { val: 'all', label: 'Semua Status' },
  { val: 'On Going', label: 'On Going', dot: 'bg-blue-500' },
  { val: 'On Schedule (Ready)', label: 'Ready', dot: 'bg-cyan-500' },
  { val: 'On Schedule (Not Ready)', label: 'Not Ready', dot: 'bg-slate-400' },
  { val: 'Finish (Review)', label: 'Review ✓', dot: 'bg-emerald-500' },
  { val: 'Finish (On Review)', label: 'On Review', dot: 'bg-orange-500' },
  { val: 'Cancel', label: 'Cancel', dot: 'bg-rose-500' },
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
  pic,
  onPicChange,
  onResetFilters,
  onRefreshData,
  isPicLocked = false,
  picList = ['Dela', 'Bagas', 'Kikik', 'Bobi', 'Dio'],
  isLoading,
}: FilterBarProps) {
  // Filter drawer/panel toggle state (mobile & desktop)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Total active filter count (excluding search)
  const totalActiveFilterCount =
    (finishMonth !== 'all' ? 1 : 0) +
    (statusTrip !== 'all' ? 1 : 0) +
    (statusPayment !== 'all' ? 1 : 0) +
    (pic !== 'all' ? 1 : 0);

  const hasAnyFilter = search !== '' || totalActiveFilterCount > 0;

  return (
    <div className="p-3 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
      {/* 1. TOP BAR: SEARCH INPUT, FILTER TOGGLE & REFRESH */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode trip, nama tamu, whatsapp, atau paket..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs transition-all h-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Button Toggle Filter (Unified for Mobile & Desktop) */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10 shrink-0 border ${
            isFilterOpen || totalActiveFilterCount > 0
              ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-xs'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70'
          }`}
          title="Buka Menu Filter"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
          {totalActiveFilterCount > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                isFilterOpen || totalActiveFilterCount > 0
                  ? 'bg-white text-primary dark:bg-slate-900 dark:text-white'
                  : 'bg-primary text-white'
              }`}
            >
              {totalActiveFilterCount}
            </span>
          )}
          {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Button Refresh */}
        <button
          type="button"
          onClick={onRefreshData}
          disabled={isLoading}
          className="inline-flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-foreground bg-muted/40 hover:bg-muted border border-border/80 transition-all disabled:opacity-60 cursor-pointer h-10 shrink-0"
          title="Segarkan data dari Google Sheets"
        >
          <RefreshCcw
            className={`w-3.5 h-3.5 ${
              isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'
            }`}
          />
          <span className="hidden md:inline ml-1.5">Segarkan</span>
        </button>
      </div>      {/* 2. MOBILE VIEW: EXPANDABLE FILTER DRAWER (ALL FILTERS INSIDE TOGGLE) */}
      {isFilterOpen && (
        <div className="md:hidden p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-3.5 animate-fade-in">
          {/* Header Drawer */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan Filter Reservasi</span>
            </div>
            {totalActiveFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Filter 1: Bulan Trip */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Bulan Trip</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => onFinishMonthChange('all')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                  finishMonth === 'all'
                    ? 'bg-orange-600 text-white border-orange-600 font-extrabold shadow-2xs'
                    : 'bg-card text-foreground hover:bg-muted border-border/60'
                }`}
              >
                Semua
              </button>
              {NAMA_BULAN.map((m) => {
                const isSelected = finishMonth === m.val;
                return (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => onFinishMonthChange(isSelected ? 'all' : m.val)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 font-extrabold shadow-2xs'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 2: Status Trip (Kolom U) */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Status Trip</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_STATUS_TRIP.map((st) => {
                const isSelected = statusTrip === st.val;
                return (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() => onStatusTripChange(isSelected ? 'all' : st.val)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-foreground text-background border-foreground font-extrabold shadow-2xs'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {st.dot && !isSelected && (
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    )}
                    <span className="truncate">{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 3: Status Pembayaran (Kolom AC) */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Status Bayar</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 'all', label: 'Semua' },
                { val: 'DP 1', label: 'DP 1' },
                { val: 'Lunas', label: 'Lunas' },
                { val: 'Cancel', label: 'Cancel' },
              ].map((pay) => (
                <button
                  key={pay.val}
                  type="button"
                  onClick={() => onStatusPaymentChange(pay.val)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                    statusPayment === pay.val
                      ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-2xs'
                      : 'bg-card text-foreground hover:bg-muted border-border/60'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter 4: PIC Reservasi */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              {isPicLocked ? <Lock className="w-3.5 h-3.5 text-primary" /> : <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>PIC Reservasi {isPicLocked && '(Terkunci)'}</span>
            </label>
            {isPicLocked ? (
              <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 flex items-center gap-2">
                <Lock size={13} className="text-primary" />
                <span className="text-xs font-bold text-foreground capitalize">PIC: {pic || 'Dela'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[{ val: 'all', label: 'Semua' }, ...picList.map((p) => ({ val: p.toLowerCase(), label: p }))].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => onPicChange(p.val)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border capitalize ${
                      pic.toLowerCase() === p.val.toLowerCase()
                        ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-2xs'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close / Apply button for mobile */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs text-center shadow-xs cursor-pointer"
            >
              Terapkan &amp; Tutup Filter
            </button>
          </div>
        </div>
      )}

      {/* 3. DESKTOP VIEW: EXPANDABLE FILTER PANEL (ALL FILTERS INSIDE TOGGLE) */}
      {isFilterOpen && (
        <div className="hidden md:block p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3.5 animate-fade-in">
          {/* Header Panel Filter */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan Filter Reservasi</span>
            </div>
            {totalActiveFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          {/* Row 1: Bulan Trip Pills */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Bulan Trip</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onFinishMonthChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  finishMonth === 'all'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-extrabold'
                    : 'bg-card text-foreground hover:bg-muted border-border/60'
                }`}
              >
                Semua
              </button>
              {NAMA_BULAN.map((m) => {
                const isSelected = finishMonth === m.val;
                return (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => onFinishMonthChange(isSelected ? 'all' : m.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-extrabold'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {m.label} ({m.short})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Status Trip Pills */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Status Trip</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_STATUS_TRIP.map((st) => {
                const isSelected = statusTrip === st.val;
                return (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() => onStatusTripChange(isSelected ? 'all' : st.val)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-foreground text-background border-foreground shadow-2xs font-extrabold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {st.dot && !isSelected && (
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    )}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Grid 2 Kolom (Status Bayar & PIC Reservasi) */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Status Bayar */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Status Pembayaran (Kolom AC)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 'all', label: 'Semua' },
                  { val: 'DP 1', label: 'DP 1' },
                  { val: 'Lunas', label: 'Lunas' },
                  { val: 'Cancel', label: 'Cancel' },
                ].map((pay) => (
                  <button
                    key={pay.val}
                    type="button"
                    onClick={() => onStatusPaymentChange(pay.val)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                      statusPayment === pay.val
                        ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-2xs'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    {pay.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PIC Reservasi */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isPicLocked ? <Lock className="w-3.5 h-3.5 text-primary" /> : <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />}
                <span>PIC Reservasi {isPicLocked && '(Terkunci)'}</span>
              </label>
              {isPicLocked ? (
                <div className="p-2 rounded-xl bg-muted/60 border border-border/80 flex items-center gap-2">
                  <Lock size={13} className="text-primary" />
                  <span className="text-xs font-bold text-foreground capitalize">PIC: {pic || 'Dela'}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[{ val: 'all', label: 'Semua' }, ...picList.map((p) => ({ val: p.toLowerCase(), label: p }))].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => onPicChange(p.val)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border capitalize ${
                        pic.toLowerCase() === p.val.toLowerCase()
                          ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-2xs'
                          : 'bg-card text-foreground hover:bg-muted border-border/60'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE FILTER CHIPS & RESET (Visible whenever filter is active) */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground mr-0.5">
              Filter aktif:
            </span>

            {finishMonth !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold text-[11px] border border-orange-200/60 dark:border-orange-900/40">
                <span>
                  Bulan: {NAMA_BULAN.find((m) => m.val === finishMonth)?.short}
                </span>
                <button
                  type="button"
                  onClick={() => onFinishMonthChange('all')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {statusTrip !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                <span>Trip: {statusTrip}</span>
                <button
                  type="button"
                  onClick={() => onStatusTripChange('all')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {statusPayment !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                <span>Bayar: {statusPayment}</span>
                <button
                  type="button"
                  onClick={() => onStatusPaymentChange('all')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {pic !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border capitalize">
                <span>PIC: {pic}</span>
                <button
                  type="button"
                  onClick={() => onPicChange('all')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                <span>&quot;{search}&quot;</span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-auto"
          >
            <RotateCcw size={11} />
            <span>Reset Semua</span>
          </button>
        </div>
      )}
    </div>
  );
}
