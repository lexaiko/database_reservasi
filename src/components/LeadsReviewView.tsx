'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Reservasi } from '@/lib/types';
import { formatDateDisplay } from '@/lib/formatters';
import {
  Search,
  ExternalLink,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Filter,
  Camera,
  MessageSquare,
  Share2,
  Sparkles,
  X,
  Save,
  AlertCircle,
  RotateCcw,
  Calendar,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

export type FilterKey = 'unreviewed' | 'reviewed' | 'unphotod' | 'photod' | 'no-leads';

export const SUMBER_LEADS_OPTIONS: string[] = [
  'Instagram',
  'TikTok',
  'Website',
  'Google Search',
  'WhatsApp',
  'Walk-in',
  'Referral / Teman',
  'Repeat Order',
  'OTA (Traveloka / Tiket)',
  'Lainnya',
];

interface LeadsReviewViewProps {
  reservations: Reservasi[];
  assignedPic?: string;
  onReservationUpdated?: (updated: Reservasi) => void;
  onRefresh?: () => void;
}

export const LeadsReviewView: React.FC<LeadsReviewViewProps> = ({
  reservations: initialReservations,
  assignedPic,
  onReservationUpdated,
  onRefresh,
}) => {
  // Global All Reservations State
  const [allReservations, setAllReservations] = useState<Reservasi[]>(initialReservations);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Search & Multi-Filter State
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  // Toggle single filter pill (supports multi-select)
  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Mutually exclusive pairs:
        if (key === 'unreviewed') next.delete('reviewed');
        if (key === 'reviewed') next.delete('unreviewed');
        if (key === 'unphotod') next.delete('photod');
        if (key === 'photod') next.delete('unphotod');
        next.add(key);
      }
      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  // Quick preset combination (e.g. Belum Review & Belum Foto)
  const setQuickCombo = (keys: FilterKey[]) => {
    const isAlreadyCombo = keys.every((k) => activeFilters.has(k)) && activeFilters.size === keys.length;
    if (isAlreadyCombo) {
      clearFilters();
    } else {
      setActiveFilters(new Set(keys));
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservasi, setSelectedReservasi] = useState<Reservasi | null>(null);

  // Modal Form States
  const [sumberLeads, setSumberLeads] = useState('');
  const [linkReview, setLinkReview] = useState('');
  const [linkFoto, setLinkFoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Load ALL reservations from API so it doesn't get capped at 50
  const loadAllData = async (forceRefresh = false) => {
    try {
      setIsLoadingAll(true);
      const res = await fetch(`/api/reservasi?all=true${forceRefresh ? '&refresh=true' : ''}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllReservations(json.data);
      }
    } catch (err) {
      console.error('Failed to load all reservations for leads review:', err);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    if (initialReservations && initialReservations.length > 0) {
      setAllReservations(initialReservations);
    } else {
      loadAllData();
    }
  }, [initialReservations]);

  // Open modal & populate values
  const handleOpenEdit = (r: Reservasi) => {
    setSelectedReservasi(r);
    setSumberLeads(r.sumberLeads || '');
    setLinkReview(r.linkReview || '');
    setLinkFoto(r.linkFoto || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setSelectedReservasi(null);
  };

  // Keyboard escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving]);

  // Submit modal form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservasi) return;

    setIsSaving(true);
    setModalError('');

    try {
      const res = await fetch(`/api/reservasi/${encodeURIComponent(selectedReservasi.kode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sumberLeads: sumberLeads.trim(),
          linkReview: linkReview.trim(),
          linkFoto: linkFoto.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan perubahan ke Google Sheets.');
      }

      const updatedObj: Reservasi = {
        ...selectedReservasi,
        sumberLeads: sumberLeads.trim(),
        linkReview: linkReview.trim(),
        linkFoto: linkFoto.trim(),
        statusTrip: linkReview.trim() ? 'Finish (Review)' : selectedReservasi.statusTrip,
      };

      // Update in local state
      setAllReservations((prev) =>
        prev.map((item) => (item.kode === updatedObj.kode ? updatedObj : item))
      );

      if (onReservationUpdated) {
        onReservationUpdated(updatedObj);
      }

      setIsModalOpen(false);
      setSelectedReservasi(null);
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dataset to use: prioritizes allReservations and filters by assignedPic if set
  const rawDataset = allReservations.length > 0 ? allReservations : initialReservations;
  const activeDataset = useMemo(() => {
    if (!assignedPic) return rawDataset;
    return rawDataset.filter((r) => r.picAgen?.toLowerCase() === assignedPic.toLowerCase());
  }, [rawDataset, assignedPic]);

  // Statistics
  const stats = useMemo(() => {
    let total = activeDataset.length;
    let withLeads = 0;
    let withReview = 0;
    let withFoto = 0;

    for (const r of activeDataset) {
      if (r.sumberLeads && r.sumberLeads.trim()) withLeads++;
      if (r.linkReview && r.linkReview.trim()) withReview++;
      if (r.linkFoto && r.linkFoto.trim()) withFoto++;
    }

    return { total, withLeads, withReview, withFoto };
  }, [activeDataset]);

  // Multi-Filter Calculation
  const filteredList = useMemo(() => {
    return activeDataset.filter((r) => {
      // 1. Search text filter
      const q = search.toLowerCase().trim();
      if (q) {
        const matchKode = r.kode.toLowerCase().includes(q);
        const matchName = r.namaTamu.toLowerCase().includes(q);
        const matchPaket = r.paket?.toLowerCase().includes(q);
        const matchLeads = (r.sumberLeads || '').toLowerCase().includes(q);
        if (!matchKode && !matchName && !matchPaket && !matchLeads) return false;
      }

      // 2. Multi-Filter logic (Kombinasi AND: semua filter aktif harus terpenuhi)
      const hasReview = !!(r.linkReview && r.linkReview.trim());
      const hasFoto = !!(r.linkFoto && r.linkFoto.trim());
      const hasLeads = !!(r.sumberLeads && r.sumberLeads.trim());

      // Filter status review
      if (activeFilters.has('unreviewed') && hasReview) return false;
      if (activeFilters.has('reviewed') && !hasReview) return false;

      // Filter status foto dokumentasi
      if (activeFilters.has('unphotod') && hasFoto) return false;
      if (activeFilters.has('photod') && !hasFoto) return false;

      // Filter status sumber leads
      if (activeFilters.has('no-leads') && hasLeads) return false;

      return true;
    });
  }, [activeDataset, search, activeFilters]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilters, pageSize]);

  // Pagination calculation
  const totalItems = filteredList.length;
  const effectivePageSize = pageSize > 0 ? pageSize : totalItems;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalItems / effectivePageSize) : 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedList =
    pageSize > 0 ? filteredList.slice(startIndex, startIndex + effectivePageSize) : filteredList;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Tamu */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
              Total Reservasi
            </span>
            <div className="font-heading font-black text-xl sm:text-2xl text-foreground flex items-center gap-2">
              <span>{stats.total}</span>
              {isLoadingAll && (
                <RefreshCw size={14} className="animate-spin text-primary" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Seluruh data sheet 2026</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Sumber Leads Terdata */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
              Sumber Leads
            </span>
            <div className="font-heading font-black text-xl sm:text-2xl text-foreground">
              {stats.withLeads}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.withLeads / stats.total) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Asal channel closing</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Ulasan / Review */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
              Link Ulasan
            </span>
            <div className="font-heading font-black text-xl sm:text-2xl text-foreground">
              {stats.withReview}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.withReview / stats.total) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Review tamu Google/OTA</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Foto Dokumentasi */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
              Link Dokumentasi
            </span>
            <div className="font-heading font-black text-xl sm:text-2xl text-foreground">
              {stats.withFoto}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.withFoto / stats.total) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Drive foto &amp; video</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode booking, nama tamu, paket, atau leads..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => {
              loadAllData(true);
              if (onRefresh) onRefresh();
            }}
            disabled={isLoadingAll}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-60"
            title="Muat ulang seluruh data langsung dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAll ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>{isLoadingAll ? 'Memuat Semua Data...' : 'Reload Data Lengkap'}</span>
          </button>
        </div>

        {/* Multi-Select Filter Pills */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
              <Filter size={12} className="text-primary" />
              <span>Saring Kriteria (Bisa Pilih Lebih Dari 1):</span>
              {activeFilters.size > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold">
                  {activeFilters.size} Aktif
                </span>
              )}
            </span>

            {activeFilters.size > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-bold text-rose-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold select-none no-scrollbar">
            {/* Tombol Semua Data */}
            <button
              type="button"
              onClick={clearFilters}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeFilters.size === 0
                  ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              Semua Data
            </button>

            {/* Shortcut Kombinasi Khusus: Belum Review & Belum Foto */}
            <button
              type="button"
              onClick={() => setQuickCombo(['unreviewed', 'unphotod'])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeFilters.has('unreviewed') && activeFilters.has('unphotod') && activeFilters.size === 2
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
              }`}
              title="Shortcut: langsung pilih tamu yang belum review DAN belum foto"
            >
              ⚡ Belum Review &amp; Belum Foto
            </button>

            {/* Individual Filter Pills (Multi-selectable) */}
            {[
              { id: 'unreviewed' as FilterKey, label: 'Belum Review' },
              { id: 'reviewed' as FilterKey, label: 'Sudah Review' },
              { id: 'unphotod' as FilterKey, label: 'Belum Foto' },
              { id: 'photod' as FilterKey, label: 'Sudah Foto' },
              { id: 'no-leads' as FilterKey, label: 'Belum Ada Leads' },
            ].map((pill) => {
              const isActive = activeFilters.has(pill.id);
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => toggleFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  {isActive && <span>✓</span>}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Read-Only Main Data Container */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {/* Desktop Table View (Read Only) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-36">Kode &amp; ID</th>
                <th className="py-3.5 px-4 w-60">Nama Tamu &amp; Jadwal</th>
                <th className="py-3.5 px-4 w-44">Sumber Leads (Kolom T)</th>
                <th className="py-3.5 px-4">Link Review (Kolom V)</th>
                <th className="py-3.5 px-4">Link Foto Dokumentasi (Kolom W)</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {isLoadingAll && allReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      <span>Memuat seluruh basis data reservasi Google Sheets...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">
                      Tidak ada reservasi yang cocok dengan pencarian / filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        clearFilters();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer mt-2"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Filter</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedList.map((r, idx) => {
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
                        <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40 text-xs">
                          {r.kode}
                        </span>
                        {r.rowNumber && (
                          <span className="text-[10px] text-muted-foreground block mt-1 font-medium">
                            Baris #{r.rowNumber}
                          </span>
                        )}
                      </td>

                      {/* Nama Tamu & Jadwal */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-foreground text-xs">{r.namaTamu}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px]" title={r.paket}>
                          {r.paket} ({r.pax} Pax)
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar size={11} className="shrink-0 text-muted-foreground" />
                          <span>
                            {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)}
                          </span>
                        </div>
                      </td>

                      {/* Sumber Leads (Read Only) */}
                      <td className="py-3.5 px-4">
                        {r.sumberLeads && r.sumberLeads.trim() ? (
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-muted/80 text-foreground border border-border/70">
                            {r.sumberLeads}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Link Review (Read Only with External Action) */}
                      <td className="py-3.5 px-4">
                        {r.linkReview && r.linkReview.trim() ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={r.linkReview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200/80 transition-colors border border-emerald-200/60 dark:border-emerald-900/40"
                              title={r.linkReview}
                            >
                              <ExternalLink size={12} />
                              <span>Buka Review</span>
                            </a>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={r.linkReview}>
                              {r.linkReview.replace(/^https?:\/\//i, '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Link Foto Dokumentasi (Read Only with External Action) */}
                      <td className="py-3.5 px-4">
                        {r.linkFoto && r.linkFoto.trim() ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={r.linkFoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 hover:bg-purple-200/80 transition-colors border border-purple-200/60 dark:border-purple-900/40"
                              title={r.linkFoto}
                            >
                              <ExternalLink size={12} />
                              <span>Buka Dokumentasi</span>
                            </a>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={r.linkFoto}>
                              {r.linkFoto.replace(/^https?:\/\//i, '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Belum Ada
                          </span>
                        )}
                      </td>

                      {/* Aksi Button Update (Memicu Pop-Up Form Modal) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Buka form pop up untuk update leads & link tamu ini"
                        >
                          <Edit3 size={13} />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Read-Only Cards */}
        <div className="block lg:hidden divide-y divide-border">
          {isLoadingAll && allReservations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="inline-flex items-center gap-2 font-semibold text-xs">
                <RefreshCw size={14} className="animate-spin text-primary" />
                <span>Memuat data lengkap reservasi...</span>
              </div>
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                Tidak ada reservasi yang cocok dengan filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  clearFilters();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer mt-2"
              >
                <RotateCcw size={12} />
                <span>Reset Filter</span>
              </button>
            </div>
          ) : (
            paginatedList.map((r) => {
              return (
                <div key={r.kode} className="p-4 space-y-3">
                  {/* Top Bar: Kode, Row, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40 text-xs">
                          {r.kode}
                        </span>
                        {r.rowNumber && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            #{r.rowNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground mt-1">{r.namaTamu}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {r.paket} ({r.pax} Pax) • {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      <Edit3 size={13} />
                      <span>Update</span>
                    </button>
                  </div>

                  {/* Summary Box: Leads, Review, Foto */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Sumber Leads:
                      </span>
                      <span className="font-bold text-foreground">
                        {r.sumberLeads || <span className="italic text-muted-foreground font-normal">Belum Diisi</span>}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Link Review:
                      </span>
                      {r.linkReview ? (
                        <a
                          href={r.linkReview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink size={11} />
                          <span>Buka Ulasan</span>
                        </a>
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground font-normal">
                          Belum Ada
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Dokumentasi Foto:
                      </span>
                      {r.linkFoto ? (
                        <a
                          href={r.linkFoto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <ExternalLink size={11} />
                          <span>Buka Drive</span>
                        </a>
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground font-normal">
                          Belum Ada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. PAGINATION FOOTER */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
              <span>
                Menampilkan <strong className="text-foreground">{startIndex + 1}</strong> –{' '}
                <strong className="text-foreground">{Math.min(startIndex + effectivePageSize, totalItems)}</strong> dari{' '}
                <strong className="text-foreground">{totalItems}</strong> reservasi
              </span>

              {/* Page size selector */}
              <div className="hidden sm:flex items-center gap-1 border-l border-border pl-3">
                <span className="text-[11px]">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Semua ({totalItems})</option>
                </select>
              </div>
            </div>

            {pageSize > 0 && totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>

      {/* 5. POP-UP FORM MODAL UNTUK UPDATE LEADS & REVIEW */}
      {isModalOpen && selectedReservasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Update Source &amp; Review
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {selectedReservasi.namaTamu} ({selectedReservasi.kode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
                title="Tutup (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Guest Quick Info Box */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Paket Trip:</span>
                  <strong className="text-foreground">{selectedReservasi.paket} ({selectedReservasi.pax} Pax)</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Jadwal Trip:</span>
                  <span className="font-bold text-foreground">
                    {formatDateDisplay(selectedReservasi.startTrip)} - {formatDateDisplay(selectedReservasi.finishTrip)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PIC Agen:</span>
                  <strong className="text-foreground">{selectedReservasi.picAgen || '-'}</strong>
                </div>
              </div>

              {/* Field 1: Sumber Leads (Kolom T) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Sumber Leads (Kolom T)
                </label>
                <input
                  type="text"
                  list="modal-sumber-leads-options"
                  value={sumberLeads}
                  onChange={(e) => setSumberLeads(e.target.value)}
                  placeholder="Pilih atau ketik sumber leads..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                />
                <datalist id="modal-sumber-leads-options">
                  {SUMBER_LEADS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
                <p className="text-[11px] text-muted-foreground">
                  Contoh: Instagram, TikTok, Website, Walk-in, Referral, Repeat Order, dsb.
                </p>
              </div>

              {/* Field 2: Link Review (Kolom V) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Link Review (Kolom V)
                  </label>
                  {linkReview && (
                    <a
                      href={linkReview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                    >
                      <ExternalLink size={11} />
                      <span>Tes Buka Tautan</span>
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={linkReview}
                  onChange={(e) => setLinkReview(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Tautan ulasan Google Review / OTA. Mengisi kolom ini otomatis mengubah status trip menjadi <em>Finish (Review)</em>.
                </p>
              </div>

              {/* Field 3: Link Foto Dokumentasi (Kolom W) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Link Foto Dokumentasi (Kolom W)
                  </label>
                  {linkFoto && (
                    <a
                      href={linkFoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                    >
                      <ExternalLink size={11} />
                      <span>Tes Buka Tautan</span>
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={linkFoto}
                  onChange={(e) => setLinkFoto(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Tautan folder Google Drive foto &amp; video dokumentasi tamu selama trip.
                </p>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsReviewView;
