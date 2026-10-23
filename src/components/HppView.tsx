'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Reservasi, MasterKategoriHpp } from '@/lib/types';
import { formatRupiah, formatDateDisplay, normalizeDateToYMD } from '@/lib/formatters';
import {
  Search,
  DollarSign,
  Layers,
  FileText,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Users,
  UserCheck,
  Eye,
  RefreshCw,
  ArrowUpDown,
  X,
  RotateCcw,
  CreditCard,
  SlidersHorizontal,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

interface HppViewProps {
  reservations: Reservasi[];
  onOpenHppModal: (r: Reservasi) => void;
  onOpenDetailModal?: (r: Reservasi) => void;
  isLoading?: boolean;
  isIntern?: boolean;
}

type HppFilterTab = 'all' | 'with-hpp' | 'without-hpp' | 'needs-update';
type SortOption =
  | 'jadwal-asc'
  | 'jadwal-desc'
  | 'order-desc'
  | 'order-asc'
  | 'hpp-desc'
  | 'profit-desc'
  | 'margin-desc'
  | 'margin-asc';

const BULAN_LIST = [
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

export const HppView: React.FC<HppViewProps> = ({
  reservations,
  onOpenHppModal,
  onOpenDetailModal,
  isLoading = false,
  isIntern = false,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<HppFilterTab>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedPic, setSelectedPic] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('jadwal-asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [masterKategori, setMasterKategori] = useState<MasterKategoriHpp>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch master kategori HPP
  useEffect(() => {
    fetch('/api/hpp?master=true')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setMasterKategori(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Helper extracting trip month number (1-12)
  const getTripMonth = (r: Reservasi): number | null => {
    const ymd = normalizeDateToYMD(r.startTrip || r.finishTrip);
    if (!ymd || !ymd.includes('-')) return null;
    const parts = ymd.split('-');
    const m = Number(parts[1]);
    return m >= 1 && m <= 12 ? m : null;
  };

  // Count reservations per month for UX indicator badges
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reservations.forEach((r) => {
      const m = getTripMonth(r);
      if (m) {
        const key = String(m);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [reservations]);

  // Unique list of PIC / Agents from reservations
  const availablePics = useMemo(() => {
    const pics = new Set<string>();
    reservations.forEach((r) => {
      if (r.picAgen && r.picAgen.trim()) pics.add(r.picAgen.trim());
    });
    return Array.from(pics).sort();
  }, [reservations]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, selectedMonth, selectedPayment, selectedPic, sortBy, pageSize]);

  // Global metrics from all reservations (unfiltered)
  const isHasHpp = (r: Reservasi) => r.hasHpp ?? ((r.hpp || 0) > 0);
  const withHppList = useMemo(() => reservations.filter(isHasHpp), [reservations]);
  const withoutHppList = useMemo(() => reservations.filter((r) => !isHasHpp(r)), [reservations]);
  const needsUpdateList = useMemo(() => reservations.filter((r) => r.needsHppUpdate), [reservations]);

  // Count active filters (excluding search)
  const activeFilterCount =
    (selectedMonth !== 'all' ? 1 : 0) +
    (activeTab !== 'all' ? 1 : 0) +
    (selectedPayment !== 'all' ? 1 : 0) +
    (selectedPic !== 'all' ? 1 : 0) +
    (sortBy !== 'jadwal-asc' ? 1 : 0);

  const hasActiveFilters = search.trim() !== '' || activeFilterCount > 0;

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    let list = reservations;

    // 1. Filter by Tab Status HPP
    if (activeTab === 'with-hpp') {
      list = list.filter(isHasHpp);
    } else if (activeTab === 'without-hpp') {
      list = list.filter((r) => !isHasHpp(r));
    } else if (activeTab === 'needs-update') {
      list = list.filter((r) => r.needsHppUpdate);
    }

    // 2. Filter by Bulan Trip
    if (selectedMonth !== 'all') {
      const targetM = Number(selectedMonth);
      list = list.filter((r) => getTripMonth(r) === targetM);
    }

    // 3. Filter by Status Bayar / Order
    if (selectedPayment !== 'all') {
      if (selectedPayment === 'Lunas') {
        list = list.filter((r) => r.statusPayment === 'Lunas');
      } else if (selectedPayment === 'DP 1') {
        list = list.filter(
          (r) => r.statusPayment === 'DP 1' || (r.statusPayment !== 'Lunas' && r.statusPayment !== 'Cancel')
        );
      } else if (selectedPayment === 'Cancel') {
        list = list.filter(
          (r) =>
            r.statusPayment === 'Cancel' ||
            r.statusTrip === 'Cancel' ||
            r.statusTrip === 'Cancel / Refund'
        );
      }
    }

    // 4. Filter by PIC Agent
    if (selectedPic !== 'all') {
      list = list.filter(
        (r) => r.picAgen && r.picAgen.trim().toLowerCase() === selectedPic.toLowerCase()
      );
    }

    // 5. Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.kode.toLowerCase().includes(q) ||
          r.namaTamu.toLowerCase().includes(q) ||
          r.paket.toLowerCase().includes(q) ||
          r.picAgen.toLowerCase().includes(q) ||
          (r.statusPayment && r.statusPayment.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reservations, activeTab, selectedMonth, selectedPayment, selectedPic, search]);

  // Sorted reservations
  const sortedReservations = useMemo(() => {
    const list = [...filteredReservations];
    switch (sortBy) {
      case 'order-desc':
        return list.sort((a, b) => (b.nilaiOrder || 0) - (a.nilaiOrder || 0));
      case 'order-asc':
        return list.sort((a, b) => (a.nilaiOrder || 0) - (b.nilaiOrder || 0));
      case 'hpp-desc':
        return list.sort((a, b) => (b.hpp || 0) - (a.hpp || 0));
      case 'profit-desc':
        return list.sort((a, b) => {
          const profitA = (a.statusPayment === 'Lunas' && isHasHpp(a)) ? Math.max(0, (a.nilaiOrder || 0) - (a.hpp || 0)) : 0;
          const profitB = (b.statusPayment === 'Lunas' && isHasHpp(b)) ? Math.max(0, (b.nilaiOrder || 0) - (b.hpp || 0)) : 0;
          return profitB - profitA;
        });
      case 'margin-desc':
        return list.sort((a, b) => (b.margin || 0) - (a.margin || 0));
      case 'margin-asc':
        return list.sort((a, b) => (a.margin || 0) - (b.margin || 0));
      case 'jadwal-desc':
        return list.sort((a, b) => {
          const da = normalizeDateToYMD(a.startTrip || a.finishTrip);
          const db = normalizeDateToYMD(b.startTrip || b.finishTrip);
          return db.localeCompare(da);
        });
      case 'jadwal-asc':
      default:
        return list.sort((a, b) => {
          const da = normalizeDateToYMD(a.startTrip || a.finishTrip);
          const db = normalizeDateToYMD(b.startTrip || b.finishTrip);
          return da.localeCompare(db);
        });
    }
  }, [filteredReservations, sortBy]);

  // Metrics based on active view (hanya transaksi yang sudah LUNAS DAN TERISI HPP, termasuk Rp 0 seperti DP hangus)
  const isEligibleForMetrics = (r: Reservasi) => isHasHpp(r) && r.statusPayment === 'Lunas';
  const filteredEligible = useMemo(
    () => filteredReservations.filter(isEligibleForMetrics),
    [filteredReservations]
  );
  const allEligibleList = useMemo(
    () => reservations.filter(isEligibleForMetrics),
    [reservations]
  );
  const activeMetricsList = hasActiveFilters ? filteredEligible : allEligibleList;

  const totalHppDisplay = useMemo(
    () => (hasActiveFilters ? filteredReservations : reservations).reduce((acc, r) => acc + (r.hpp || 0), 0),
    [hasActiveFilters, filteredReservations, reservations]
  );
  const totalRevenueEligible = useMemo(
    () => activeMetricsList.reduce((acc, r) => acc + (r.nilaiOrder || 0), 0),
    [activeMetricsList]
  );
  const totalProfitDisplay = useMemo(
    () => activeMetricsList.reduce((acc, r) => acc + Math.max(0, (r.nilaiOrder || 0) - (r.hpp || 0)), 0),
    [activeMetricsList]
  );
  const avgMarginDisplay =
    totalRevenueEligible > 0 && totalProfitDisplay > 0
      ? ((totalProfitDisplay / totalRevenueEligible) * 100).toFixed(1)
      : '0';

  // Reset all filters handler
  const handleResetAllFilters = () => {
    setSearch('');
    setActiveTab('all');
    setSelectedMonth('all');
    setSelectedPayment('all');
    setSelectedPic('all');
    setSortBy('jadwal-asc');
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = sortedReservations.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedItems =
    pageSize === 0
      ? sortedReservations
      : sortedReservations.slice(startIndex, startIndex + effectivePageSize);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. OVERVIEW METRICS CARDS (2-1 Grid on Mobile, 3-Col on Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Total HPP */}
        <div className="col-span-1 p-3 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Total HPP (AE)
            </span>
            {hasActiveFilters && (
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 shrink-0">
                Filter
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-6 sm:h-7 w-28 bg-muted/60 animate-pulse rounded-lg my-0.5" />
          ) : (
            <div className="text-xs sm:text-xl font-black text-orange-600 dark:text-orange-400 tabular-nums leading-tight break-all">
              {formatRupiah(totalHppDisplay)}
            </div>
          )}
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
            {isLoading
              ? 'Memuat data HPP...'
              : hasActiveFilters
              ? `${activeMetricsList.length} trip terfilter`
              : `${withHppList.length} trip terisi HPP`}
          </span>
        </div>

        {/* Card 2: Gross Profit */}
        <div className="col-span-1 p-3 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate flex items-center gap-1">
              {isIntern && <Lock className="w-3 h-3 text-muted-foreground" />}
              <span>Gross Profit (AF)</span>
            </span>
            {hasActiveFilters && !isIntern && (
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                Laba
              </span>
            )}
          </div>
          {isIntern ? (
            <div className="text-xs sm:text-sm font-bold text-muted-foreground leading-tight py-1">
              Terkunci
            </div>
          ) : isLoading ? (
            <div className="h-6 sm:h-7 w-28 bg-muted/60 animate-pulse rounded-lg my-0.5" />
          ) : (
            <div className="text-xs sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight break-all">
              {formatRupiah(totalProfitDisplay)}
            </div>
          )}
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
            {isIntern
              ? 'Akses khusus PIC & Superadmin'
              : isLoading
              ? 'Memuat data profit...'
              : hasActiveFilters
              ? `${activeMetricsList.length} trip lunas & ber-HPP`
              : `${allEligibleList.length} trip lunas & ber-HPP`}
          </span>
        </div>

        {/* Card 3: Rata-rata Margin (2-Cols span on mobile, full width row) */}
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-5 rounded-2xl bg-card border border-border shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
              {isIntern && <Lock className="w-3 h-3 text-muted-foreground" />}
              <span>Rata-rata Margin Operasional (AG)</span>
            </span>
            <TrendingUp size={15} className="text-primary shrink-0" />
          </div>
          <div className="flex items-baseline justify-between sm:block mt-1 sm:mt-1.5">
            {isIntern ? (
              <div className="text-xs sm:text-sm font-bold text-muted-foreground py-0.5">
                Terkunci
              </div>
            ) : isLoading ? (
              <div className="h-7 sm:h-8 w-20 bg-muted/60 animate-pulse rounded-lg my-0.5" />
            ) : (
              <div className="text-lg sm:text-2xl font-black text-primary tabular-nums">
                {avgMarginDisplay}%
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block sm:mt-1">
              {isIntern
                ? 'Akses khusus PIC & Superadmin'
                : isLoading
                ? 'Menghitung rasio...'
                : hasActiveFilters
                ? 'Rata-rata margin data tersaring'
                : 'Persentase profitabilitas rata-rata'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR RESERVASI HPP LENGKAP & FILTER TOGGLE CONTROLS */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Table Header: Title, Search & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-foreground tracking-tight">
                  Daftar HPP per Reservasi Tamu
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-muted text-foreground border border-border">
                  {filteredReservations.length} / {reservations.length} Data
                </span>
              </div>
            </div>

            {/* Quick Search & Mobile Filter Toggle Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari kode trip, nama tamu, PIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all h-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button (Unified Mobile & Desktop) */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10 shrink-0 border ${
                  isFilterOpen || activeFilterCount > 0
                    ? 'bg-primary text-primary-foreground border-primary font-extrabold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70'
                }`}
                title="Buka Menu Filter"
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isFilterOpen || activeFilterCount > 0
                        ? 'bg-white text-primary dark:bg-slate-900 dark:text-white'
                        : 'bg-primary text-white'
                    }`}
                  >
                    {activeFilterCount}
                  </span>
                )}
                {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Page Size Selector on Desktop */}
              <div className="hidden sm:flex items-center gap-1.5 bg-card border border-border/80 rounded-xl px-2.5 h-10 text-xs text-muted-foreground shrink-0 shadow-2xs">
                <span className="font-bold text-[11px]">Hal:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>Semua</option>
                </select>
              </div>
            </div>
          </div>

          {/* MOBILE VIEW: EXPANDABLE FILTER DRAWER (ALL FILTERS INSIDE TOGGLE) */}
          {isFilterOpen && (
            <div className="md:hidden p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  <span>Pengaturan Filter HPP</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* 1. Bulan Trip */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>Bulan Trip</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('all')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                      selectedMonth === 'all'
                        ? 'bg-orange-600 text-white border-orange-600 font-extrabold shadow-2xs'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    Semua
                  </button>
                  {BULAN_LIST.map((b) => {
                    const count = monthCounts[b.val] || 0;
                    const isSelected = selectedMonth === b.val;
                    return (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => setSelectedMonth(isSelected ? 'all' : b.val)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 font-extrabold shadow-2xs'
                            : 'bg-card text-foreground hover:bg-muted border-border/60'
                        }`}
                      >
                        {b.short} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Status HPP */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-foreground" />
                  <span>Status HPP</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all' as HppFilterTab, label: `Semua (${reservations.length})` },
                    { id: 'with-hpp' as HppFilterTab, label: `Sudah Ada (${withHppList.length})` },
                    { id: 'without-hpp' as HppFilterTab, label: `Belum Diisi (${withoutHppList.length})` },
                    { id: 'needs-update' as HppFilterTab, label: `Perlu Update (${needsUpdateList.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border truncate ${
                        activeTab === tab.id
                          ? 'bg-foreground text-background border-foreground font-extrabold shadow-2xs'
                          : 'bg-card text-foreground hover:bg-muted border-border/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Status Bayar & PIC */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Status Bayar</span>
                  </label>
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">Semua Bayar</option>
                    <option value="Lunas">Lunas</option>
                    <option value="DP 1">DP 1 / Sisa</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>PIC Agen</span>
                  </label>
                  <select
                    value={selectedPic}
                    onChange={(e) => setSelectedPic(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">Semua PIC</option>
                    {availablePics.map((pic) => (
                      <option key={pic} value={pic}>
                        {pic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Urutan Sortir */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Urutan Data</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-2.5 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="jadwal-asc">Jadwal: Terdekat</option>
                  <option value="jadwal-desc">Jadwal: Terjauh</option>
                  <option value="order-desc">Order: Tertinggi</option>
                  <option value="order-asc">Order: Terendah</option>
                  <option value="hpp-desc">HPP: Tertinggi</option>
                  <option value="profit-desc">Profit: Tertinggi</option>
                  <option value="margin-desc">Margin %: Tertinggi</option>
                  <option value="margin-asc">Margin %: Terendah</option>
                </select>
              </div>

              {/* Close Button */}
              <div className="pt-1">
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

          {/* DESKTOP VIEW: EXPANDABLE FILTER PANEL */}
          {isFilterOpen && (
            <div className="hidden md:block p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3.5 animate-fade-in">
              {/* Header Panel Filter */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  <span>Pengaturan Filter HPP</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
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
                    onClick={() => setSelectedMonth('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      selectedMonth === 'all'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-extrabold'
                        : 'bg-card text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    Semua Bulan
                  </button>

                  {BULAN_LIST.map((b) => {
                    const count = monthCounts[b.val] || 0;
                    const isSelected = selectedMonth === b.val;

                    return (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => setSelectedMonth(isSelected ? 'all' : b.val)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-extrabold'
                            : count > 0
                            ? 'bg-card text-foreground hover:bg-muted border-border/60'
                            : 'bg-muted/30 text-muted-foreground/60 border-border/40 hover:text-muted-foreground'
                        }`}
                        title={`${b.label} (${count} trip)`}
                      >
                        <span>{b.label}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white font-extrabold'
                                : 'bg-muted text-muted-foreground font-semibold'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Status HPP Pills */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-foreground" />
                  <span>Status HPP</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      activeTab === 'all'
                        ? 'bg-foreground text-background border-foreground shadow-2xs font-extrabold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    Semua ({reservations.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('with-hpp')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      activeTab === 'with-hpp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-extrabold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    Sudah Ada HPP ({withHppList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('without-hpp')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      activeTab === 'without-hpp'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-extrabold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
                    }`}
                  >
                    Belum Diisi ({withoutHppList.length})
                  </button>

                  {needsUpdateList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('needs-update')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1 ${
                        activeTab === 'needs-update'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-extrabold'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      <AlertTriangle size={12} className="inline mr-1" />
                      <span>Perlu Update ({needsUpdateList.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Grid 3 Kolom (Status Bayar, PIC Agent, Urutan Sortir) */}
              <div className="grid grid-cols-3 gap-4 pt-1">
                {/* Status Bayar */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Status Pembayaran</span>
                  </label>
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
                  >
                    <option value="all">Semua Status Bayar</option>
                    <option value="Lunas">Lunas</option>
                    <option value="DP 1">DP 1 / Sisa</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </div>

                {/* PIC Agent */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>PIC Agent (Sales)</span>
                  </label>
                  <select
                    value={selectedPic}
                    onChange={(e) => setSelectedPic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer capitalize"
                  >
                    <option value="all">Semua PIC</option>
                    {availablePics.map((pic) => (
                      <option key={pic} value={pic}>
                        {pic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urutan Sortir */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Urutan Sortir Data</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
                  >
                    <option value="jadwal-asc">Jadwal: Terdekat</option>
                    <option value="jadwal-desc">Jadwal: Terjauh</option>
                    <option value="order-desc">Nilai Order: Tertinggi</option>
                    <option value="order-asc">Nilai Order: Terendah</option>
                    <option value="hpp-desc">HPP: Tertinggi</option>
                    <option value="profit-desc">Gross Profit: Tertinggi</option>
                    <option value="margin-desc">Margin %: Tertinggi</option>
                    <option value="margin-asc">Margin %: Terendah</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE FILTERS CHIP BAR (Shows whenever user filters anything) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/70 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
                  <SlidersHorizontal size={12} />
                  <span>Filter Aktif:</span>
                </span>

                {selectedMonth !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-400 font-bold text-[11px] border border-orange-200/60 dark:border-orange-900/50">
                    <span>Bulan: {BULAN_LIST.find((b) => b.val === selectedMonth)?.short}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMonth('all')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {activeTab !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                    <span>
                      Status:{' '}
                      {activeTab === 'with-hpp'
                        ? 'Ada HPP'
                        : activeTab === 'without-hpp'
                        ? 'Belum Ada'
                        : 'Perlu Update'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {selectedPayment !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                    <span>Bayar: {selectedPayment}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPayment('all')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {selectedPic !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                    <span>PIC: {selectedPic}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPic('all')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {search.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                    <span>&quot;{search}&quot;</span>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {sortBy !== 'jadwal-asc' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border border-border">
                    <span>Urutan Kustom</span>
                    <button
                      type="button"
                      onClick={() => setSortBy('jadwal-asc')}
                      className="hover:text-foreground cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>

              {/* Reset All Button */}
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 font-extrabold text-[11px] transition-all cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset Semua</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. MOBILE CARD FEED (Screen < md) - RAFI & ELEGAN */}
        <div className="block md:hidden divide-y divide-border/60 min-h-[300px]">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground font-semibold">
              <div className="inline-flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-primary" />
                <span>Memuat seluruh data HPP...</span>
              </div>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-12 px-4 text-center text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">
                Tidak ada reservasi yang sesuai dengan filter.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw size={12} />
                  <span>Hapus Filter &amp; Tampilkan Semua</span>
                </button>
              )}
            </div>
          ) : (
            paginatedItems.map((r, idx) => {
              const hasHpp = isHasHpp(r);
              const rowNumberDisplay = r.rowNumber ? `#${r.rowNumber}` : '';

              return (
                <div
                  key={r.kode || idx}
                  className="p-4 space-y-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Top Bar: Kode, Row, PIC, Payment Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-lg border border-orange-200/60 dark:border-orange-900/40 text-xs shadow-2xs">
                        {r.kode}
                      </span>
                      {rowNumberDisplay && (
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                          Baris {rowNumberDisplay}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.statusPayment === 'Lunas'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                          : r.statusPayment === 'Cancel'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                      }`}
                    >
                      {r.statusPayment || 'DP 1'}
                    </span>
                  </div>

                  {/* Guest Name & Package */}
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-foreground tracking-tight leading-snug">
                      {r.namaTamu}
                    </h5>
                    <div className="text-[11px] text-muted-foreground font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-foreground font-bold">{r.paket}</span>
                      <span>•</span>
                      <span>{r.pax} Pax</span>
                      <span>•</span>
                      <span>PIC: <strong className="text-foreground">{r.picAgen || '-'}</strong></span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <Calendar size={12} className="shrink-0 text-orange-500" />
                      <span>
                        {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)}
                      </span>
                    </div>
                  </div>

                  {/* Financial Grid: 2x2 Clean Structured Box */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">
                        Nilai Order
                      </span>
                      <span className="font-extrabold text-foreground tabular-nums block text-xs">
                        {formatRupiah(r.nilaiOrder)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">
                        Total HPP (AE)
                      </span>
                      {hasHpp ? (
                        <span className="font-black text-orange-600 dark:text-orange-400 tabular-nums block text-xs">
                          {formatRupiah(r.hpp)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground inline-block px-1.5 py-0.5 rounded bg-muted border border-border/50">
                          Belum Diisi
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">
                        Gross Profit (AF)
                      </span>
                      <span className="font-black text-xs tabular-nums block">
                        {isIntern ? (
                          <span className="text-muted-foreground font-semibold text-[11px]">Terkunci</span>
                        ) : !hasHpp ? (
                          <span className="text-muted-foreground font-semibold text-[11px]">-</span>
                        ) : r.statusPayment !== 'Lunas' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]" title="Belum Lunas: Profit baru dihitung setelah lunas">Belum Lunas</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(r.profit)}</span>
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">
                        Margin % (AG)
                      </span>
                      <span className="font-black text-foreground tabular-nums block text-xs">
                        {isIntern ? (
                          <span className="text-muted-foreground font-semibold text-[11px]">Terkunci</span>
                        ) : !hasHpp ? (
                          <span className="text-muted-foreground font-semibold text-[11px]">0%</span>
                        ) : r.statusPayment !== 'Lunas' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Belum Lunas</span>
                        ) : (
                          `${r.margin}%`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Mobile: Comfortable 40px touch targets */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {onOpenDetailModal && (
                      <button
                        type="button"
                        onClick={() => onOpenDetailModal(r)}
                        className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 min-h-[40px] active:scale-98 shadow-2xs"
                      >
                        <FileText size={14} />
                        <span>Detail HPP</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenHppModal(r)}
                      className={`py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 min-h-[40px] active:scale-98 shadow-2xs ${
                        !onOpenDetailModal ? 'col-span-2' : ''
                      }`}
                    >
                      <Edit3 size={14} />
                      <span>Update HPP</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. DESKTOP TABLE CONTENT (Screen >= md) */}
        <div className="hidden md:block overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode &amp; ID</th>
                <th className="py-3.5 px-4">Tamu &amp; PIC</th>
                <th className="py-3.5 px-4">Nilai Order &amp; Status</th>
                <th className="py-3.5 px-4 text-right">Total HPP (AE)</th>
                <th className="py-3.5 px-4 text-right">Gross Profit (AF)</th>
                <th className="py-3.5 px-4 text-right">Margin (%)</th>
                <th className="py-3.5 px-4 text-center w-40">Aksi HPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-medium text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      <span>Memuat seluruh data HPP...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">
                        Tidak ada reservasi yang sesuai dengan filter yang dipilih.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <RotateCcw size={12} />
                          <span>Hapus Filter &amp; Tampilkan Semua Data</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((r, idx) => {
                  const hasHpp = isHasHpp(r);
                  const rowNumberDisplay = r.rowNumber ? `#${r.rowNumber}` : '';

                  return (
                    <tr
                      key={r.kode || idx}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-muted-foreground text-[11px]">
                        {startIndex + idx + 1}
                      </td>

                      {/* Kode */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40 text-xs">
                            {r.kode}
                          </span>
                        </div>
                        {rowNumberDisplay && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
                            Baris {rowNumberDisplay}
                          </span>
                        )}
                      </td>

                      {/* Tamu & PIC */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-foreground text-xs">{r.namaTamu}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <UserCheck size={11} className="text-muted-foreground" />
                          <span>PIC: <strong>{r.picAgen || '-'}</strong></span>
                        </div>
                      </td>

                      {/* Nilai Order & Status Bayar */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-xs text-foreground tabular-nums">
                          {formatRupiah(r.nilaiOrder)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              r.statusPayment === 'Lunas'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {r.statusPayment || 'DP 1'}
                          </span>
                        </div>
                      </td>

                      {/* Total HPP */}
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {hasHpp ? (
                          <span className="font-black text-orange-600 dark:text-orange-400 text-xs">
                            {formatRupiah(r.hpp)}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Gross Profit */}
                      <td className="py-3.5 px-4 text-right tabular-nums font-black text-xs">
                        {isIntern ? (
                          <span className="text-[11px] text-muted-foreground font-semibold">Terkunci</span>
                        ) : !hasHpp ? (
                          <span className="text-[11px] text-muted-foreground font-semibold">-</span>
                        ) : r.statusPayment !== 'Lunas' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]" title="Belum Lunas: Profit baru dihitung setelah lunas">Belum Lunas</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(r.profit)}</span>
                        )}
                      </td>

                      {/* Margin (%) */}
                      <td className="py-3.5 px-4 text-right tabular-nums font-black text-xs">
                        {isIntern ? (
                          <span className="text-[11px] text-muted-foreground font-semibold">Terkunci</span>
                        ) : !hasHpp ? (
                          <span className="text-[11px] text-muted-foreground font-semibold">0%</span>
                        ) : r.statusPayment !== 'Lunas' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Belum Lunas</span>
                        ) : (
                          `${r.margin}%`
                        )}
                      </td>

                      {/* Aksi Ganda: Detail HPP & Update HPP */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {onOpenDetailModal && (
                            <button
                              type="button"
                              onClick={() => onOpenDetailModal(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Buka Laporan Resmi HPP untuk tamu ini"
                            >
                              <FileText size={12} />
                              <span>Detail</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenHppModal(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-[11px] font-extrabold transition-all cursor-pointer"
                            title="Input atau Update Status &amp; HPP tamu ini"
                          >
                            <Edit3 size={12} />
                            <span>Update</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        {totalItems > 0 && pageSize > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60">
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan <strong className="text-foreground">{startIndex + 1}</strong> –{' '}
              <strong className="text-foreground">{Math.min(startIndex + effectivePageSize, totalItems)}</strong> dari{' '}
              <strong className="text-foreground">{totalItems}</strong> reservasi
              {hasActiveFilters && ' (disaring)'}
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              <span className="text-xs font-extrabold px-2 text-foreground font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HppView;
