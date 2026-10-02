'use client';

import React, { useState, useEffect } from 'react';
import { Reservasi } from '@/lib/types';
import { X, Building2, Users, MapPin, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface ModalEditCrewHotelProps {
  reservasi: Reservasi | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ModalEditCrewHotel({
  reservasi,
  isOpen,
  onClose,
  onSuccess,
}: ModalEditCrewHotelProps) {
  const [hotel, setHotel] = useState('');
  const [crew, setCrew] = useState('');
  const [mepo, setMepo] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (reservasi) {
      setHotel(reservasi.hotel || '');
      setCrew(reservasi.crew || '');
      setMepo(reservasi.mepo || '');
      setCatatan(reservasi.catatan || '');
      setErrorMsg('');
    }
  }, [reservasi]);

  if (!isOpen || !reservasi) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/reservasi/${reservasi.kode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel,
          crew,
          mepo,
          catatan,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengedit hotel dan crew.');
      }

      onSuccess(`Data operasional (Hotel & Crew) untuk ${reservasi.namaTamu} (${reservasi.kode}) berhasil disimpan!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-foreground">
        {/* Header Modal */}
        <div className="px-4 py-3.5 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
                Form Edit Operasional (Hotel &amp; Crew)
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold">
                Tamu: <strong className="text-foreground">{reservasi.namaTamu}</strong> (#{reservasi.kode})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Field Hotel (Kolom P) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Building2 size={14} className="text-orange-500" />
              <span>Hotel &amp; Akomodasi (Kolom P)</span>
            </label>
            <input
              type="text"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              placeholder="Contoh: Hotel Santika Bwi (Room 201, 202) / Exclude"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <p className="text-[10px] text-muted-foreground">
              Nama hotel, nomor kamar, atau status akomodasi peserta trip.
            </p>
          </div>

          {/* Field Crew (Kolom Q) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users size={14} className="text-purple-500" />
              <span>Crew, Driver &amp; Guide (Kolom Q)</span>
            </label>
            <input
              type="text"
              value={crew}
              onChange={(e) => setCrew(e.target.value)}
              placeholder="Contoh: Driver Mas Budi (Avanza B 1234 CD), Guide Mas Rian"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <p className="text-[10px] text-muted-foreground">
              Rincian nama driver, plat mobil, tour guide, atau fotografer bertugas.
            </p>
          </div>

          {/* Field Meeting Point / Mepo (Kolom O) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-500" />
              <span>Meeting Point / Mepo (Kolom O)</span>
            </label>
            <input
              type="text"
              value={mepo}
              onChange={(e) => setMepo(e.target.value)}
              placeholder="Contoh: Stasiun Banyuwangi Kota - Jam 08:00 WIB"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Field Catatan Operasional (Kolom R) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText size={14} className="text-blue-500" />
              <span>Catatan Operasional (Kolom R)</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan khusus request tamu, makanan pantangan, dll..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer flex items-center justify-center text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[42px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all disabled:opacity-60 cursor-pointer text-center"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Simpan Operasional</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
