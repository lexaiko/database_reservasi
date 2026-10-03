'use client';

import React, { useState, useEffect } from 'react';
import { ReservasiInput } from '@/lib/types';
import { formatRibuan, parseCurrency, formatRupiah } from '@/lib/formatters';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import {
  DEFAULT_SINGKATAN,
  SINGKATAN_TOOLTIPS,
  DEFAULT_PAKET_GROUPS,
  getStoredSingkatan,
  saveStoredSingkatan,
  getStoredPaket,
  saveStoredPaket,
} from '@/lib/destinasi';

interface ModalNewReservationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  defaultPic?: string;
  isPicLocked?: boolean;
}

export default function ModalNewReservation({
  isOpen,
  onClose,
  onSuccess,
  defaultPic = 'Dela',
  isPicLocked = false,
}: ModalNewReservationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [kode, setKode] = useState('');
  const [namaTamu, setNamaTamu] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [startTrip, setStartTrip] = useState(() => new Date().toISOString().substring(0, 10));
  const [finishTrip, setFinishTrip] = useState(() => new Date().toISOString().substring(0, 10));
  const [pax, setPax] = useState('2');
  const [trip, setTrip] = useState('1');
  const [paket, setPaket] = useState('');
  const [day1, setDay1] = useState<string[]>([]);
  const [day2, setDay2] = useState<string[]>([]);
  const [day3, setDay3] = useState<string[]>([]);
  const [day4, setDay4] = useState<string[]>([]);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);
  const [catatan, setCatatan] = useState('');
  const [picAgen, setPicAgen] = useState(defaultPic || 'Dela');

  useEffect(() => {
    if (isOpen && defaultPic) {
      setPicAgen(defaultPic);
    }
  }, [isOpen, defaultPic]);
  const [sumberLeads, setSumberLeads] = useState('Instagram');
  const [nilaiOrderStr, setNilaiOrderStr] = useState('');
  const [dpStr, setDpStr] = useState('');
  const [tglDp, setTglDp] = useState(() => new Date().toISOString().substring(0, 10));

  // Singkatan Rute Destinasi & Custom Paket
  const [customSingkatan, setCustomSingkatan] = useState<string[]>([]);
  const [newSingkatanInput, setNewSingkatanInput] = useState('');
  const [customPaket, setCustomPaket] = useState<string[]>([]);
  const [newPaketInput, setNewPaketInput] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCustomSingkatan(getStoredSingkatan());
      setCustomPaket(getStoredPaket());
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Nilai finansial live
  const nilaiOrder = parseCurrency(nilaiOrderStr);
  const dp = parseCurrency(dpStr);
  const sisa = Math.max(0, nilaiOrder - dp);
  const isLunas = nilaiOrder > 0 && dp >= nilaiOrder;
  const isOverpaid = dp > nilaiOrder && nilaiOrder > 0;
  const tripDuration = Math.max(1, parseInt(trip, 10) || 1);

  // Safe local date parser for YYYY-MM-DD
  const parseYMD = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  // Auto calc date & duration
  const handleStartTripChange = (newStart: string) => {
    setStartTrip(newStart);
    if (!finishTrip || finishTrip < newStart) {
      setFinishTrip(newStart);
      setTrip('1');
    } else {
      const d1 = parseYMD(newStart);
      const d2 = parseYMD(finishTrip);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setTrip(String(diff > 0 ? diff : 1));
    }
  };

  const handleFinishTripChange = (newFinish: string) => {
    setFinishTrip(newFinish);
    if (startTrip && newFinish >= startTrip) {
      const d1 = parseYMD(startTrip);
      const d2 = parseYMD(newFinish);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setTrip(String(diff > 0 ? diff : 1));
    }
  };

  const handleTripDaysChange = (newDays: string) => {
    setTrip(newDays);
    const daysNum = parseInt(newDays, 10);
    if (startTrip && daysNum && daysNum > 0) {
      const d1 = parseYMD(startTrip);
      d1.setDate(d1.getDate() + (daysNum - 1));
      const yyyy = d1.getFullYear();
      const mm = String(d1.getMonth() + 1).padStart(2, '0');
      const dd = String(d1.getDate()).padStart(2, '0');
      setFinishTrip(`${yyyy}-${mm}-${dd}`);
    }
    if (activeDayTab > (daysNum || 1)) {
      setActiveDayTab(1);
    }
  };

  // Toggle checkbox destination
  const handleToggleDest = (daySetter: React.Dispatch<React.SetStateAction<string[]>>, code: string) => {
    daySetter((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  // Format currency typing
  const handleUangInput = (val: string, setter: (v: string) => void) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) {
      setter('');
      return;
    }
    const num = parseInt(rawDigits, 10);
    setter(formatRibuan(num));
  };

  // Active day list & setter
  const currentDayState =
    activeDayTab === 1 ? day1 : activeDayTab === 2 ? day2 : activeDayTab === 3 ? day3 : day4;
  const currentDaySetter =
    activeDayTab === 1 ? setDay1 : activeDayTab === 2 ? setDay2 : activeDayTab === 3 ? setDay3 : setDay4;

  const allSingkatan = Array.from(new Set([...DEFAULT_SINGKATAN, ...customSingkatan]));

  const handleAddSingkatan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSingkatanInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!allSingkatan.includes(trimmed)) {
      const next = [...customSingkatan, trimmed];
      setCustomSingkatan(next);
      saveStoredSingkatan(next);
    }
    currentDaySetter((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setNewSingkatanInput('');
  };

  const handleAddPaket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPaketInput.trim();
    if (!trimmed) return;
    if (!customPaket.includes(trimmed)) {
      const next = [...customPaket, trimmed];
      setCustomPaket(next);
      saveStoredPaket(next);
    }
    setPaket(trimmed);
    setNewPaketInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!kode.trim()) {
      setErrorMessage('Kode Reservasi wajib diisi.');
      return;
    }
    if (!namaTamu.trim()) {
      setErrorMessage('Nama Tamu / Pemesan wajib diisi.');
      return;
    }
    if (!startTrip) {
      setErrorMessage('Tanggal Mulai Trip wajib diisi.');
      return;
    }
    if (!paket) {
      setErrorMessage('Silakan pilih Kategori Paket Trip.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ReservasiInput = {
        kode: kode.trim().toUpperCase(),
        namaTamu: namaTamu.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
        startTrip,
        finishTrip: finishTrip || startTrip,
        pax: parseInt(pax, 10) || 1,
        trip: trip || '1',
        paket,
        day1: day1.join(', '),
        day2: day2.join(', '),
        day3: day3.join(', '),
        day4: day4.join(', '),
        mepo: '',
        hotel: '',
        crew: '',
        catatan: catatan.trim(),
        picAgen,
        sumberLeads,
        nilaiOrder,
        dp,
        tglDp,
        statusTrip: 'On Schedule (Not Ready)',
        statusPayment: isLunas ? 'Lunas' : dp > 0 ? 'DP 1' : 'Draft',
      };

      const res = await fetch('/api/reservasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyimpan reservasi');
      }

      onSuccess(data.message);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto sm:overflow-hidden bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-t-2xl sm:rounded-3xl w-full max-w-6xl h-[95dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 relative">
        
        {/* Header Modal */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-100 dark:border-orange-900/40 shrink-0">
              <Compass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Input Reservasi Baru 2026
                </h2>
                <span className="text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40 shrink-0 hidden sm:inline">
                  Google Sheets Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Penyimpanan langsung ke Database Reservasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container with Flex-1 & Fixed Mobile Bottom Bar */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 pb-24 lg:pb-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Data Input Panels (8 Cols) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* PANEL 1: PROFIL & KONTAK TAMU */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[11px] font-black flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Identitas &amp; Kontak Tamu
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Kolom A - E</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kode Reservasi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: TB-01 atau BWI-2601"
                      value={kode}
                      onChange={(e) => setKode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-black text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Tamu / Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Pemesan / Instansi"
                      value={namaTamu}
                      onChange={(e) => setNamaTamu(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 dark:focus-within:ring-orange-950/50 focus-within:bg-white dark:focus-within:bg-slate-800">
                      <span className="px-2.5 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
                        WA
                      </span>
                      <input
                        type="text"
                        placeholder="08123456789 atau 628..."
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-3 py-2 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Instagram
                      </label>
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                        <span className="px-2 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="username"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full px-2.5 py-2 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        TikTok
                      </label>
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                        <span className="px-2 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="username"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          className="w-full px-2.5 py-2 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL 2: JADWAL & PAKET TRIP */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[11px] font-black flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Jadwal Trip &amp; Paket
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Kolom F - J</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mulai Trip *
                    </label>
                    <input
                      type="date"
                      required
                      value={startTrip}
                      onChange={(e) => handleStartTripChange(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Selesai Trip *
                    </label>
                    <input
                      type="date"
                      required
                      value={finishTrip}
                      onChange={(e) => handleFinishTripChange(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Durasi (Hari)
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={trip}
                        onChange={(e) => handleTripDaysChange(e.target.value)}
                        className="w-full px-2.5 py-2 bg-transparent text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <span className="px-2 text-[11px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border-l border-slate-200 dark:border-slate-700">
                        Hari
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Pax *
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                      <input
                        type="number"
                        required
                        min="1"
                        value={pax}
                        onChange={(e) => setPax(e.target.value)}
                        className="w-full px-2.5 py-2 bg-transparent text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <span className="px-2 text-[11px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border-l border-slate-200 dark:border-slate-700">
                        Pax
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Kategori Paket Trip *
                  </label>
                  <select
                    required
                    value={paket}
                    onChange={(e) => setPaket(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih Paket Trip --</option>
                    {DEFAULT_PAKET_GROUPS.map((grp) => (
                      <optgroup key={grp.label} label={grp.label}>
                        {grp.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {customPaket.length > 0 && (
                      <optgroup label="Paket Kustom Tambahan">
                        {customPaket.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {paket &&
                      !DEFAULT_PAKET_GROUPS.some((g) => g.options.includes(paket)) &&
                      !customPaket.includes(paket) && (
                        <optgroup label="Paket Lainnya">
                          <option value={paket}>{paket}</option>
                        </optgroup>
                      )}
                  </select>

                  {/* Tambah Paket Baru */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mt-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      + Tambah Paket:
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={newPaketInput}
                        onChange={(e) => setNewPaketInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPaket();
                          }
                        }}
                        placeholder="Kode / nama paket baru..."
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 min-h-[36px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddPaket}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[36px] flex items-center justify-center cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL 3: ITINERARY DESTINASI */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[11px] font-black flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Destinasi Harian (Day 1 - 4)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Kolom K - N</span>
                </div>

                {/* Tab Switcher Hari (Dinamis sesuai Durasi) */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rute Destinasi:</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].slice(0, Math.min(4, Math.max(1, tripDuration))).map((dayNum) => {
                        const count =
                          dayNum === 1 ? day1.length : dayNum === 2 ? day2.length : dayNum === 3 ? day3.length : day4.length;
                        const isActive = activeDayTab === dayNum;
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => setActiveDayTab(dayNum)}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                              isActive
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>Hari {dayNum}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isActive
                                  ? 'bg-orange-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Singkatan Selector & Manual Input */}
                  <div className="space-y-2.5">
                    {/* Input Rute Hari Aktif */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Rute Hari {activeDayTab}:
                      </span>
                      <input
                        type="text"
                        value={currentDayState.join(', ')}
                        onChange={(e) => {
                          const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          currentDaySetter(parts);
                        }}
                        placeholder="Klik singkatan di bawah atau ketik manual (cth: I, B, D)..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                      {currentDayState.length > 0 && (
                        <button
                          type="button"
                          onClick={() => currentDaySetter([])}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 px-2 py-1 whitespace-nowrap"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Chips Singkatan Saja */}
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                      {allSingkatan.map((code) => {
                        const checked = currentDayState.includes(code);
                        const tooltip = SINGKATAN_TOOLTIPS[code];
                        return (
                          <button
                            key={code}
                            type="button"
                            title={tooltip ? `${code} (${tooltip})` : code}
                            onClick={() => handleToggleDest(currentDaySetter, code)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                              checked
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400'
                            }`}
                          >
                            {checked ? '✓ ' : ''}{code}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tambah Singkatan Baru */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        + Tambah Singkatan:
                      </span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={newSingkatanInput}
                          onChange={(e) => setNewSingkatanInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSingkatan();
                            }
                          }}
                          placeholder="Singkatan baru (cth: PL, TR)..."
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 uppercase min-h-[36px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddSingkatan}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[36px] flex items-center justify-center cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Catatan Khusus */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Operasional (Kolom R)
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Catatan makanan, titik jemput khusus, alergi, atau request tamu..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* PANEL 4: PIC & LEADS */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[11px] font-black flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Tim Sales &amp; Kanal Leads
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Kolom S &amp; T</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIC Handling (Sales) *
                    </label>
                    <select
                      value={picAgen}
                      onChange={(e) => setPicAgen(e.target.value)}
                      disabled={isPicLocked}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      {['Dela', 'Bagas', 'Kikik', 'Bobi', 'Dio'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {isPicLocked && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        PIC terkunci otomatis sesuai akun Anda ({defaultPic}).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sumber Leads *
                    </label>
                    <select
                      value={sumberLeads}
                      onChange={(e) => setSumberLeads(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Website">Website</option>
                      <option value="Tiktok">Tiktok</option>
                      <option value="Rekomendasi">Rekomendasi</option>
                      <option value="Repeat Order">Repeat Order</option>
                      <option value="Belum Tahu">Belum Tahu</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Sticky Billing & Summary Panel (4 Cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-2 space-y-4">
              
              {/* Financial Box */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Keuangan &amp; Pembayaran
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isLunas
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : dp > 0
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isLunas ? 'Lunas' : dp > 0 ? 'DP 1' : 'Draft'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nilai Order (Total Tagihan) *
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                    <span className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={nilaiOrderStr}
                      onChange={(e) => handleUangInput(e.target.value, setNilaiOrderStr)}
                      className="w-full px-3 py-2 bg-transparent text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Uang Muka (DP) *
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 overflow-hidden focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                    <span className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={dpStr}
                      onChange={(e) => handleUangInput(e.target.value, setDpStr)}
                      className="w-full px-3 py-2 bg-transparent text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal DP Diterima *
                  </label>
                  <input
                    type="date"
                    required
                    value={tglDp}
                    onChange={(e) => setTglDp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Ringkasan Finansial Tagihan & DP */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>Total Tagihan:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(nilaiOrder)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span>DP Masuk:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(dp)}</span>
                  </div>
                  {isLunas && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Status Pembayaran:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">LUNAS</span>
                    </div>
                  )}
                </div>

                {isOverpaid && (
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>Perhatian: DP melebihi Nilai Order.</span>
                  </div>
                )}
              </div>

              {/* Trip Quick Specs Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Ringkasan Reservasi
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pemesan:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                    {namaTamu || '-'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Paket:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{paket || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Jadwal:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {trip} Hari ({pax} Pax)
                  </span>
                </div>
              </div>

              {/* Submit Buttons (Desktop View) */}
              <div className="hidden lg:block space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/25 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Simpan Reservasi Baru</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-center cursor-pointer"
                >
                  Batal / Kembali
                </button>
              </div>

            </div>
          </div>
        </div>

          {/* Sticky Mobile Bottom Bar: Quick Submit */}
          <div className="block lg:hidden shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xl z-30 safe-area-pb">

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all text-center flex items-center justify-center cursor-pointer min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="col-span-2 py-2.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/20 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Simpan Reservasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
