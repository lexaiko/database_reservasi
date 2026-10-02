'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Reservasi, MasterKategoriHpp } from '@/lib/types';
import { formatRupiah, formatDateDisplay } from '@/lib/formatters';
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
  Eye,
  RefreshCw,
} from 'lucide-react';

interface HppViewProps {
  reservations: Reservasi[];
  onOpenHppModal: (r: Reservasi) => void;
  onOpenDetailModal?: (r: Reservasi) => void;
  isLoading?: boolean;
}

type HppFilterTab = 'all' | 'with-hpp' | 'without-hpp' | 'needs-update';

export const HppView: React.FC<HppViewProps> = ({
  reservations,
  onOpenHppModal,
  onOpenDetailModal,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<HppFilterTab>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [masterKategori, setMasterKategori] = useState<MasterKategoriHpp>({});

  // Fetch master kategori HPP
  useEffect(() => {
    fetch('/api/hpp?master=true')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setMasterKategori(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, pageSize]);

  // Global metrics from all reservations
  const withHppList = useMemo(() => reservations.filter((r) => (r.hpp || 0) > 0), [reservations]);
  const withoutHppList = useMemo(() => reservations.filter((r) => !r.hpp || r.hpp === 0), [reservations]);
  const needsUpdateList = useMemo(() => reservations.filter((r) => r.needsHppUpdate), [reservations]);

  const totalHppSemua = useMemo(
    () => withHppList.reduce((acc, r) => acc + (r.hpp || 0), 0),
    [withHppList]
  );
  const totalRevenue = useMemo(
    () => withHppList.reduce((acc, r) => acc + (r.nilaiOrder || 0), 0),
    [withHppList]
  );
  const totalProfit = totalRevenue - totalHppSemua;
  const avgMargin =
    totalRevenue > 0 && totalHppSemua > 0
      ? ((totalProfit / totalRevenue) * 100).toFixed(1)
      : '0';

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    let list = reservations;

    // Filter by tab
    if (activeTab === 'with-hpp') {
      list = list.filter((r) => (r.hpp || 0) > 0);
    } else if (activeTab === 'without-hpp') {
      list = list.filter((r) => !r.hpp || r.hpp === 0);
    } else if (activeTab === 'needs-update') {
      list = list.filter((r) => r.needsHppUpdate);
    }

    // Filter by search
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
  }, [reservations, activeTab, search]);

  // Pagination calculation
  const totalItems = filteredReservations.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedItems =
    pageSize === 0
      ? filteredReservations
      : filteredReservations.slice(startIndex, startIndex + effectivePageSize);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Total HPP Terhitung (AE)
          </span>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {formatRupiah(totalHppSemua)}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Dari {withHppList.length} trip yang sudah diinput HPP
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Estimasi Gross Profit (AF)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(totalProfit)}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Akumulasi Omset dikurangi beban HPP
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Rata-rata Margin Operasional (AG)
          </span>
          <div className="text-2xl font-black text-primary tabular-nums">
            {avgMargin}%
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Persentase profitabilitas rata-rata
          </span>
        </div>
      </div>

      {/* 2. DAFTAR RESERVASI HPP LENGKAP */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Table Header: Title, Filter Tabs & Search */}
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-foreground tracking-tight">
                  Daftar HPP per Reservasi Tamu
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-muted text-foreground border border-border">
                  {reservations.length} Total Data
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih tamu untuk melihat Laporan Resmi HPP atau memperbarui rincian pengeluaran per baris
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kode trip, nama tamu, PIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Filter Tabs & Page Size Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Semua ({reservations.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('with-hpp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'with-hpp'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Sudah Ada HPP ({withHppList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('without-hpp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'without-hpp'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Belum Diisi ({withoutHppList.length})
              </button>

              {needsUpdateList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('needs-update')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'needs-update'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <AlertTriangle size={12} />
                  <span>Perlu Update ({needsUpdateList.length})</span>
                </button>
              )}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>Semua ({totalItems})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode &amp; ID</th>
                <th className="py-3.5 px-4">Tamu &amp; PIC</th>
                <th className="py-3.5 px-4">Paket &amp; Jadwal</th>
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
                  <td colSpan={9} className="py-12 text-center text-muted-foreground font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      <span>Memuat seluruh data HPP...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    Tidak ada reservasi yang sesuai dengan kriteria filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((r, idx) => {
                  const hasHpp = (r.hpp || 0) > 0;
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
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            Baris {rowNumberDisplay}
                          </span>
                        )}
                      </td>

                      {/* Tamu & PIC */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-foreground text-xs">{r.namaTamu}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span>PIC: <strong>{r.picAgen || '-'}</strong></span>
                        </div>
                      </td>

                      {/* Paket & Jadwal */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-xs truncate max-w-[180px]" title={r.paket}>
                          {r.paket}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar size={11} className="shrink-0 text-muted-foreground" />
                          <span>
                            {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)}
                          </span>
                          <span>•</span>
                          <span>{r.pax} Pax</span>
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
                          {r.sisaPelunasan > 0 && (
                            <span className="text-[10px] text-rose-500 font-bold tabular-nums">
                              Sisa: {formatRupiah(r.sisaPelunasan)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total HPP */}
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {hasHpp ? (
                          <div>
                            <span className="font-black text-orange-600 dark:text-orange-400 text-xs block">
                              {formatRupiah(r.hpp)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Terisi
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Gross Profit */}
                      <td className="py-3.5 px-4 text-right tabular-nums font-black text-xs text-emerald-600 dark:text-emerald-400">
                        {hasHpp ? formatRupiah(r.profit) : '-'}
                      </td>

                      {/* Margin (%) */}
                      <td className="py-3.5 px-4 text-right tabular-nums font-black text-xs">
                        {hasHpp ? `${r.margin}%` : '0%'}
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
              {search && ' (disaring)'}
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
