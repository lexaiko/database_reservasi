'use client';

import React from 'react';
import { Reservasi } from '@/lib/types';
import { formatRupiah, formatDateDisplay } from '@/lib/formatters';
import {
  X,
  MessageCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Star,
  ExternalLink,
  FileText,
} from 'lucide-react';

interface ModalDetailProps {
  reservasi: Reservasi | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenHpp: (r: Reservasi) => void;
  onOpenDetailHpp?: (r: Reservasi) => void;
  onOpenEdit: (r: Reservasi) => void;
}

export default function ModalDetail({
  reservasi,
  isOpen,
  onClose,
  onOpenHpp,
  onOpenDetailHpp,
  onOpenEdit,
}: ModalDetailProps) {
  if (!isOpen || !reservasi) return null;

  const cleanWa = (reservasi.whatsapp || '').replace(/[^0-9]/g, '');
  const waLink = cleanWa.startsWith('0')
    ? `https://wa.me/62${cleanWa.substring(1)}`
    : `https://wa.me/${cleanWa}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header Modal */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-sm border border-orange-200/60 dark:border-orange-900/40">
              {reservasi.kode.substring(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {reservasi.namaTamu}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {reservasi.kode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                PIC: <strong className="text-slate-700 dark:text-slate-300">{reservasi.picAgen || '-'}</strong> | Baris Spreadsheet: #{reservasi.rowNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenEdit(reservasi);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/60 dark:border-orange-900/40 text-xs font-bold transition-all"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status Quick Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Status Trip (Kolom U)
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {reservasi.computedStatusTrip || reservasi.statusTrip}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Status Bayar (Kolom AC)
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {reservasi.statusPayment || 'DP 1'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section 1: Profil Tamu & Kontak */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              1. Informasi Tamu &amp; Kontak
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Nama Tamu</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold text-sm">{reservasi.namaTamu}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">WhatsApp</span>
                {reservasi.whatsapp ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{reservasi.whatsapp}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">-</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Instagram</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{reservasi.instagram || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">TikTok</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{reservasi.tiktok || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Sumber Leads</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{reservasi.sumberLeads || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">PIC Agen</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{reservasi.picAgen || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Operasional & Itinerary (Day 1 - Day 4) */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              2. Detail Itinerary &amp; Operasional
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Start Trip</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatDateDisplay(reservasi.startTrip)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Finish Trip</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatDateDisplay(reservasi.finishTrip)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Jumlah Pax</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{reservasi.pax} Pax</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Paket</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{reservasi.paket}</span>
              </div>
            </div>

            {/* Day 1 - 4 Destinasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Day 1', val: reservasi.day1 },
                { label: 'Day 2', val: reservasi.day2 },
                { label: 'Day 3', val: reservasi.day3 },
                { label: 'Day 4', val: reservasi.day4 },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block mb-1">{d.label}</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.val || '-'}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Meeting Point (Kolom O)</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{reservasi.mepo || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Hotel (Kolom P)</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{reservasi.hotel || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Crew / Driver (Kolom Q)</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{reservasi.crew || '-'}</span>
              </div>
            </div>

            {reservasi.catatan && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-bold block mb-0.5">Catatan Operasional:</span>
                <p className="font-medium whitespace-pre-wrap">{reservasi.catatan}</p>
              </div>
            )}
          </div>

          {/* Section 3: Finansial, HPP & Profit */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                3. Finansial, HPP &amp; Profitabilitas
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenDetailHpp?.(reservasi);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/60 dark:border-orange-900/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Detail HPP</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenHpp(reservasi);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Update Status &amp; HPP</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Nilai Order (X)</span>
                <span className="text-slate-900 dark:text-slate-100 font-black text-sm">{formatRupiah(reservasi.nilaiOrder)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Jumlah DP (Y)</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{formatRupiah(reservasi.dp)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{formatDateDisplay(reservasi.tglDp)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Sisa Pelunasan (AA)</span>
                <span className={`font-extrabold ${reservasi.sisaPelunasan > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatRupiah(reservasi.sisaPelunasan)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Total HPP (AE)</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatRupiah(reservasi.hpp)}</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 sm:col-span-2">
                <span className="text-emerald-700 dark:text-emerald-400 block font-semibold mb-0.5">Gross Profit (AF)</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-black text-base">
                  {reservasi.hpp > 0 ? formatRupiah(reservasi.profit) : '-'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-0.5">Gross Margin (AG)</span>
                <span className="text-slate-900 dark:text-slate-100 font-black text-base">
                  {reservasi.hpp > 0 ? `${reservasi.margin}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Link Review & Foto */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              4. Dokumentasi &amp; Tautan Eksternal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Link Review (Kolom V)</span>
                  {reservasi.linkReview ? (
                    <a
                      href={reservasi.linkReview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>Buka Google Review</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">Belum diisi</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Link Foto (Kolom W)</span>
                  {reservasi.linkFoto ? (
                    <a
                      href={reservasi.linkFoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Buka Google Drive Foto</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">Belum diisi</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
