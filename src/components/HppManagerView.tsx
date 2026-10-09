'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Reservasi, HppItem, MasterKategoriHpp, StatusPayment } from '@/lib/types';
import { formatRupiah, formatRibuan, parseCurrency, computeMargin, formatDateDisplay } from '@/lib/formatters';
import {
  Search,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Printer,
  Edit3,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Building2,
  Users,
  User,
  Hash,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { HppView } from './HppView';

interface TempHppItem {
  id: string;
  kategori: string;
  vendor: string;
  nominalStr: string;
  catatan: string;
  isCustomVendor?: boolean;
}

interface HppManagerViewProps {
  reservations: Reservasi[];
  initialKode?: string;
  initialMode?: 'update' | 'detail' | 'katalog';
  onModeChange?: (mode: 'update' | 'detail' | 'katalog') => void;
  onRefreshData?: () => void;
  onSuccess?: (msg: string) => void;
  assignedPic?: string;
  isIntern?: boolean;
}

export default function HppManagerView({
  reservations,
  initialKode,
  initialMode = 'katalog',
  onModeChange,
  onRefreshData,
  onSuccess,
  assignedPic,
  isIntern = false,
}: HppManagerViewProps) {
  // Mode state: 'update' (UPDATE STATUS DAN HPP), 'detail' (Detail HPP Laporan), 'katalog' (Semua HPP)
  const [activeMode, setActiveMode] = useState<'update' | 'detail' | 'katalog'>(initialMode);

  const handleSwitchMode = (m: 'update' | 'detail' | 'katalog') => {
    setActiveMode(m);
    if (onModeChange) onModeChange(m);
  };
  const [activeKode, setActiveKode] = useState<string>(initialKode || '');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  // Scoped reservations according to assignedPic (if admin/intern/non-pic admin)
  const scopedReservationsList = useMemo(() => {
    if (!assignedPic) return reservations;
    const picArray = assignedPic.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (picArray.length === 0) return reservations;
    return reservations.filter((r) => picArray.includes((r.picAgen || '').toLowerCase()));
  }, [reservations, assignedPic]);

  // Selected reservation from scoped reservations list
  const selectedReservasi = useMemo(() => {
    if (!activeKode) return null;
    return scopedReservationsList.find((r) => r.kode.toLowerCase() === activeKode.toLowerCase()) || null;
  }, [activeKode, scopedReservationsList]);

  // HPP Editor States
  const [isLoadingHpp, setIsLoadingHpp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [items, setItems] = useState<TempHppItem[]>([]);
  const [statusBayar, setStatusBayar] = useState<StatusPayment>('DP 1');
  const [masterKategori, setMasterKategori] = useState<MasterKategoriHpp>({
    Tiket: ['Ijen', 'Baluran', 'Djawatan', 'Mustika', 'Pulau Merah'],
    'Sewa Jeep': ['Hendrik', 'Sandi', 'Dio'],
    Penginapan: ['Illira', 'Ketapang Indah', 'Santika', 'Solong'],
    Kapal: ['Sandi', 'Bangsring'],
    'Fee Crew': ['Bagas', 'Kikik', 'Bobi', 'Dio'],
    'Sewa Hiace': ['Dio', 'Arif'],
    Lainnya: ['Parkir', 'Konsumsi', 'Air Mineral'],
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync initialKode if changed from props
  useEffect(() => {
    if (initialKode && initialKode !== activeKode) {
      setActiveKode(initialKode);
    }
  }, [initialKode]);

  // Sync initialMode if changed from props
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode]);

  // Sync search input if a guest is selected or initialKode changes
  useEffect(() => {
    if (selectedReservasi) {
      setSearchInput(`${selectedReservasi.namaTamu} [${selectedReservasi.kode}]`);
    } else if (!activeKode) {
      setSearchInput('');
    }
  }, [selectedReservasi, activeKode]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch HPP items & master kategori for selected guest
  const loadHppData = async (kodeTarget: string) => {
    if (!kodeTarget) return;
    setIsLoadingHpp(true);
    setErrorMessage('');

    try {
      const [hppRes, masterRes] = await Promise.all([
        fetch(`/api/hpp?kode=${encodeURIComponent(kodeTarget)}`).then((r) => r.json()),
        fetch('/api/hpp?master=true').then((r) => r.json()),
      ]);

      if (masterRes.success && masterRes.data) {
        setMasterKategori((prev) => ({ ...prev, ...masterRes.data }));
      }

      if (hppRes.success && hppRes.data) {
        const rawItems: HppItem[] = hppRes.data.items || [];
        if (rawItems.length > 0) {
          setItems(
            rawItems.map((it, idx) => ({
              id: String(idx + 1),
              kategori: it.kategori,
              vendor: it.vendor,
              nominalStr: formatRibuan(it.nominal),
              catatan: it.catatan || '',
            }))
          );
        } else {
          setItems([
            {
              id: '1',
              kategori: 'Tiket',
              vendor: '',
              nominalStr: '',
              catatan: '',
            },
          ]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal memuat rincian HPP dari server.');
    } finally {
      setIsLoadingHpp(false);
    }
  };

  useEffect(() => {
    if (activeKode) {
      loadHppData(activeKode);
      if (selectedReservasi) {
        setStatusBayar((selectedReservasi.statusPayment as StatusPayment) || 'DP 1');
      }
    }
  }, [activeKode, selectedReservasi]);

  // Autocomplete filtering
  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return scopedReservationsList.slice(0, 10);
    const q = searchInput.toLowerCase();
    return scopedReservationsList
      .filter(
        (r) =>
          r.namaTamu.toLowerCase().includes(q) ||
          r.kode.toLowerCase().includes(q) ||
          r.paket.toLowerCase().includes(q) ||
          r.picAgen.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [scopedReservationsList, searchInput]);

  const handleSelectGuest = (r: Reservasi) => {
    setActiveKode(r.kode);
    setSearchInput(`${r.namaTamu} [${r.kode}]`);
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsDropdownOpen(false);

    const match = searchInput.match(/\[([A-Za-z0-9-]+)\]/);
    const target = match ? match[1] : searchInput.trim();
    const found = scopedReservationsList.find(
      (r) => r.kode.toLowerCase() === target.toLowerCase() || r.namaTamu.toLowerCase().includes(target.toLowerCase())
    );
    if (found) {
      setActiveKode(found.kode);
      setSearchInput(`${found.namaTamu} [${found.kode}]`);
    }
  };

  // Calculations for active guest
  const totalHpp = items.reduce((sum, item) => sum + parseCurrency(item.nominalStr), 0);
  const nilaiOrder = selectedReservasi?.nilaiOrder || 0;
  const profit = totalHpp > 0 ? Math.max(0, nilaiOrder - totalHpp) : 0;
  const margin = computeMargin(nilaiOrder, totalHpp);

  // Group items by category for Detail view
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    items.forEach((it) => {
      const nom = parseCurrency(it.nominalStr);
      if (nom > 0 && it.kategori) {
        summary[it.kategori] = (summary[it.kategori] || 0) + nom;
      }
    });
    return summary;
  }, [items]);

  // Item list handlers
  const handleAddItem = () => {
    const firstCat = Object.keys(masterKategori)[0] || 'Tiket';
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        kategori: firstCat,
        vendor: '',
        nominalStr: '',
        catatan: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof TempHppItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'nominalStr') {
          const rawDigits = String(val).replace(/\D/g, '');
          if (!rawDigits) {
            return { ...it, nominalStr: '' };
          }
          const num = parseInt(rawDigits, 10);
          return { ...it, nominalStr: formatRibuan(num) };
        }
        return { ...it, [field]: val };
      })
    );
  };

  // Save to Google Sheets
  const handleSaveHpp = async () => {
    if (!selectedReservasi) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const validItems = items
        .filter((it) => it.kategori && it.vendor && parseCurrency(it.nominalStr) > 0)
        .map((it) => ({
          kategori: it.kategori,
          vendor: it.vendor,
          nominal: parseCurrency(it.nominalStr),
          catatan: it.catatan,
        }));

      const res = await fetch('/api/hpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: selectedReservasi.kode,
          namaTamu: selectedReservasi.namaTamu,
          totalHpp,
          statusPayment: statusBayar,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan HPP ke Google Sheets.');
      }

      const msg = `✅ HPP & Status Pembayaran untuk ${selectedReservasi.namaTamu} (${selectedReservasi.kode}) berhasil disimpan! Total: ${formatRupiah(totalHpp)}`;
      setSuccessMessage(msg);
      if (onSuccess) onSuccess(msg);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back header: only shown when in Detail or Update mode */}
      {activeMode !== 'katalog' && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleSwitchMode('katalog')}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-extrabold transition-all cursor-pointer shadow-2xs active:scale-98 shrink-0"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="sm:hidden">Semua HPP</span>
            <span className="hidden sm:inline">Kembali ke Semua data HPP</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
              Mode: {activeMode === 'detail' ? 'Laporan Detail HPP' : 'Update Status & HPP'}
            </span>
            <span className="text-xs font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-200/60 dark:border-orange-900/40">
              {activeKode}
            </span>
          </div>
        </div>
      )}

      {/* 2. SEARCH BAR: ONLY SHOWN IF NO GUEST SELECTED IN DETAIL/UPDATE */}
      {activeMode !== 'katalog' && !selectedReservasi && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                <Search size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  Cek Tamu &amp; Pilih Reservasi
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Cari nama tamu atau kode trip untuk memperbarui status dan rincian HPP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onRefreshData && (
                <button
                  type="button"
                  onClick={() => {
                    if (onRefreshData) onRefreshData();
                    if (activeKode) loadHppData(activeKode);
                  }}
                  disabled={isLoadingHpp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
                  title="Segarkan Data dari Sheet"
                >
                  <RefreshCw size={13} className={isLoadingHpp ? 'animate-spin text-primary' : ''} />
                  <span>Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Input & Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="relative mt-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Ketik nama tamu atau kode trip (contoh: TB-01 atau BWI-2601)..."
                  className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer shrink-0"
              >
                Cari
              </button>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border/60 z-30 max-h-72 overflow-y-auto">
                {suggestions.map((r) => (
                  <button
                    key={r.kode}
                    type="button"
                    onClick={() => handleSelectGuest(r)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-muted/60 transition-colors cursor-pointer text-xs ${
                      activeKode.toLowerCase() === r.kode.toLowerCase() ? 'bg-orange-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">
                        {r.kode}
                      </span>
                      <div>
                        <span className="font-bold text-foreground block">{r.namaTamu}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.paket} • {r.pax} Pax • PIC: {r.picAgen}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[11px] text-muted-foreground hidden sm:block">
                        {formatDateDisplay(r.finishTrip || r.startTrip)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          r.statusPayment === 'Lunas'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {r.statusPayment}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SELECTED GUEST PROFILE CARD (Only in Update & Detail Mode) */}
      {activeMode !== 'katalog' && selectedReservasi && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Left: Guest Identity */}
            <div className="lg:col-span-7 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                {selectedReservasi.kode.substring(0, 4)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    {selectedReservasi.namaTamu}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-extrabold bg-muted text-foreground border border-border">
                    {selectedReservasi.kode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40">
                    {selectedReservasi.paket}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span><strong>{selectedReservasi.pax}</strong> Pax</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>PIC: <strong>{selectedReservasi.picAgen}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>
                      Jadwal: <strong>{formatDateDisplay(selectedReservasi.startTrip)}</strong> s/d{' '}
                      <strong>{formatDateDisplay(selectedReservasi.finishTrip)}</strong>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>Baris #{selectedReservasi.rowNumber}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Financial Quick Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                  Nilai Order
                </span>
                <span className="font-extrabold text-foreground block text-xs sm:text-sm">
                  {formatRupiah(selectedReservasi.nilaiOrder)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                  Status Bayar
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md font-black text-[11px] ${
                    selectedReservasi.statusPayment === 'Lunas'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {selectedReservasi.statusPayment}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTENT SECTIONS ACCORDING TO MODE */}

      {/* Fallback state if no guest is selected yet */}
      {!selectedReservasi && activeMode !== 'katalog' && (
        <div className="p-8 sm:p-14 rounded-2xl border border-dashed border-border bg-card/40 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-2">
            <Search size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {activeMode === 'detail'
              ? 'Cari & Pilih Tamu untuk Melihat Detail HPP'
              : 'Cari & Pilih Tamu untuk Update Status & HPP'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Ketik nama tamu atau kode trip pada kolom pencarian di atas untuk memilih tamu yang ingin Anda periksa.
          </p>
        </div>
      )}

      {/* === MODE 1: UPDATE STATUS DAN HPP === */}
      {activeMode === 'update' && selectedReservasi && (
        <div className="space-y-5 animate-fade-in">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Card: Status Pembayaran */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Update Status Pembayaran (Kolom AC)
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perbarui status pembayaran tamu secara langsung di Google Sheets
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <label className="text-xs font-extrabold text-foreground whitespace-nowrap">
                Status Bayar:
              </label>
              <select
                value={statusBayar}
                onChange={(e) => setStatusBayar(e.target.value as StatusPayment)}
                className="px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              >
                <option value="DP 1">DP 1</option>
                <option value="DP 2">DP 2</option>
                <option value="DP 3">DP 3</option>
                <option value="Lunas">Lunas</option>
                <option value="Cancel">Cancel</option>
              </select>
            </div>
          </div>

          {/* Card: Rincian Pengeluaran HPP */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                  Rincian Biaya Pengeluaran HPP
                </h3>
                <p className="text-xs text-muted-foreground">
                  Data otomatis tersimpan ke tab &apos;RincianHPP&apos; dan merangkum kolom HPP utama di Google Sheets
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full sm:w-auto min-h-[40px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Biaya</span>
              </button>
            </div>

            {isLoadingHpp ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-primary" />
                <span>Memuat data rincian HPP...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                Belum ada rincian biaya. Klik &quot;Tambah Biaya&quot; untuk menginput.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const vendorList = masterKategori[it.kategori] || [];

                  return (
                    <div
                      key={it.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/30 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center group"
                    >
                      {/* 1. Kategori */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-muted-foreground mb-1">
                          Kategori
                        </label>
                        <select
                          value={it.kategori}
                          onChange={(e) => {
                            handleUpdateItem(it.id, 'kategori', e.target.value);
                            handleUpdateItem(it.id, 'vendor', '');
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        >
                          {Object.keys(masterKategori).map((kat) => (
                            <option key={kat} value={kat}>
                              {kat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Vendor / Keterangan */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-muted-foreground mb-1">
                          Vendor / Keterangan
                        </label>
                        {it.isCustomVendor ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Ketik vendor baru..."
                              value={it.vendor}
                              onChange={(e) => handleUpdateItem(it.id, 'vendor', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-amber-500/50 bg-amber-500/10 text-xs font-semibold text-foreground focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(it.id, 'isCustomVendor', false)}
                              className="text-[11px] text-muted-foreground hover:text-foreground px-1"
                              title="Pilih dari daftar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={it.vendor}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  handleUpdateItem(it.id, 'isCustomVendor', true);
                                  handleUpdateItem(it.id, 'vendor', '');
                                } else {
                                  handleUpdateItem(it.id, 'vendor', e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                            >
                              <option value="">-- Pilih Vendor --</option>
                              {vendorList.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                              <option value="__custom__">+ Input Manual...</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 3. Nominal (Rp) */}
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-muted-foreground mb-1">
                          Nominal (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={it.nominalStr}
                            onChange={(e) => handleUpdateItem(it.id, 'nominalStr', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-xs font-black text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* 4. Catatan */}
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-bold text-muted-foreground mb-1">
                          Catatan
                        </label>
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={it.catatan}
                          onChange={(e) => handleUpdateItem(it.id, 'catatan', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* 5. Delete Action */}
                      <div className="sm:col-span-1 flex justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="w-full sm:w-auto h-9 px-3 sm:px-2 inline-flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 sm:border-transparent transition-all cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sm:hidden font-bold">Hapus Biaya</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Summary Footer & Action */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total HPP Terhitung:
              </div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
                {formatRupiah(totalHpp)}
              </div>
              {isIntern ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-[11px] font-bold text-muted-foreground border border-border">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span>Estimasi Profit &amp; Margin: Terkunci (Akses PIC &amp; Superadmin)</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground font-semibold">
                  Estimasi Profit: <strong className="text-emerald-700 dark:text-emerald-400">{formatRupiah(profit)}</strong> (Margin: {margin}%)
                  {selectedReservasi?.statusPayment !== 'Lunas' && (
                    <span className="text-amber-600 dark:text-amber-400 block text-[11px] font-bold mt-0.5">
                      *Status pembayaran belum lunas: Profit riil baru dihitung setelah pelunasan
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSwitchMode('detail')}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 py-3 sm:py-3.5 px-4 rounded-xl text-foreground font-bold text-xs bg-muted/70 hover:bg-muted border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Buka format laporan resmi HPP"
              >
                <FileText size={15} />
                <span>Lihat Laporan HPP</span>
              </button>

              <button
                type="button"
                onClick={handleSaveHpp}
                disabled={isSaving || isLoadingHpp || !selectedReservasi}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 py-3 sm:py-3.5 px-6 rounded-xl text-white font-extrabold text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Simpan HPP &amp; Status Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODE 2: DETAIL HPP (LAPORAN RESMI) === */}
      {activeMode === 'detail' && selectedReservasi && (
        <div className="space-y-5 animate-fade-in" id="printable-hpp-report">
          {/* Action Bar: Print & Edit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Laporan Rincian Biaya Operasional Trip</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer min-h-[42px] sm:min-h-0"
              >
                <Printer size={15} />
                <span>Cetak / Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('update')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[42px] sm:min-h-0"
              >
                <Edit3 size={15} />
                <span>Edit HPP Ini</span>
              </button>
            </div>
          </div>

          {/* Laporan Card Shell */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-xs space-y-6">
            {/* Report Header */}
            <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-orange-600 text-white">
                    LAPORAN HPP
                  </span>
                  <span className="text-xs font-bold text-muted-foreground font-mono">
                    #{selectedReservasi.kode}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {selectedReservasi.namaTamu}
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Paket: <strong>{selectedReservasi.paket}</strong> ({selectedReservasi.pax} Pax) • PIC: {selectedReservasi.picAgen}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-muted-foreground">
                <span className="block font-bold text-foreground">TripBanyuwangi ERP</span>
                <span>Jadwal: {formatDateDisplay(selectedReservasi.startTrip)} - {formatDateDisplay(selectedReservasi.finishTrip)}</span>
                <span className="block mt-1 font-bold text-emerald-600 dark:text-emerald-400">
                  Status Bayar: {selectedReservasi.statusPayment}
                </span>
              </div>
            </div>

            {/* Subtotal per Kategori */}
            {Object.keys(categorySummary).length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Ringkasan Subtotal Biaya per Kategori
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(categorySummary).map(([cat, total]) => (
                    <div key={cat} className="p-3 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                        {cat}
                      </span>
                      <span className="font-extrabold text-foreground text-xs sm:text-sm tabular-nums">
                        {formatRupiah(total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rincian Transaksi Pengeluaran Vendor (UX-Optimized for Mobile) */}
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Daftar Transaksi Pengeluaran Vendor
              </span>

              {/* Mobile View: Clean, Readable Item Feed */}
              <div className="block md:hidden divide-y divide-border/60 rounded-xl border border-border bg-card p-3">
                {items.filter((it) => parseCurrency(it.nominalStr) > 0).length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground italic text-xs">
                    Belum ada data pengeluaran HPP yang dicatat untuk tamu ini.
                  </div>
                ) : (
                  items
                    .filter((it) => parseCurrency(it.nominalStr) > 0)
                    .map((it, idx) => (
                      <div key={it.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-muted text-[10px] font-extrabold text-muted-foreground flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                              {it.kategori}
                            </span>
                            {it.vendor && (
                              <span className="text-xs font-bold text-foreground">
                                {it.vendor}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-xs text-orange-600 dark:text-orange-400 tabular-nums shrink-0">
                            {formatRupiah(parseCurrency(it.nominalStr))}
                          </span>
                        </div>
                        {it.catatan && (
                          <p className="text-[11px] text-muted-foreground pl-6.5">
                            {it.catatan}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* Desktop & Print View: Standard Table */}
              <div className="hidden md:block print:block border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Vendor / Tujuan</th>
                      <th className="py-2.5 px-3">Catatan</th>
                      <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.filter((it) => parseCurrency(it.nominalStr) > 0).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                          Belum ada data pengeluaran HPP yang dicatat untuk tamu ini.
                        </td>
                      </tr>
                    ) : (
                      items
                        .filter((it) => parseCurrency(it.nominalStr) > 0)
                        .map((it, idx) => (
                          <tr key={it.id} className="hover:bg-muted/30">
                            <td className="py-2.5 px-3 text-center font-bold text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-foreground">
                              {it.kategori}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {it.vendor || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {it.catatan || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-foreground tabular-nums">
                              {formatRupiah(parseCurrency(it.nominalStr))}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Bottom Line Card */}
            <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                  Nilai Tagihan (X)
                </span>
                <span className="text-sm sm:text-base font-black text-foreground tabular-nums block truncate">
                  {formatRupiah(nilaiOrder)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase block mb-0.5">
                  Total HPP (AE)
                </span>
                <span className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 tabular-nums block truncate">
                  {formatRupiah(totalHpp)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-0.5 flex items-center gap-1">
                  {isIntern && <Lock className="w-3 h-3" />}
                  <span>Gross Profit (AF)</span>
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums block truncate">
                  {isIntern ? (
                    <span className="text-xs text-muted-foreground font-semibold">Terkunci</span>
                  ) : (
                    formatRupiah(profit)
                  )}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5 flex items-center gap-1">
                  {isIntern && <Lock className="w-3 h-3" />}
                  <span>Gross Margin (%) (AG)</span>
                </span>
                <span className="text-sm sm:text-base font-black text-foreground tabular-nums block truncate">
                  {isIntern ? (
                    <span className="text-xs text-muted-foreground font-semibold">Terkunci</span>
                  ) : totalHpp > 0 ? (
                    `${margin}%`
                  ) : (
                    '0%'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODE 3: KATALOG SEMUA HPP === */}
      {activeMode === 'katalog' && (
        <div className="space-y-5 animate-fade-in">
          <HppView
            reservations={scopedReservationsList}
            isLoading={reservations.length === 0}
            isIntern={isIntern}
            onOpenHppModal={(r) => {
              setActiveKode(r.kode);
              handleSwitchMode('update');
            }}
            onOpenDetailModal={(r) => {
              setActiveKode(r.kode);
              handleSwitchMode('detail');
            }}
          />
        </div>
      )}
    </div>
  );
}
