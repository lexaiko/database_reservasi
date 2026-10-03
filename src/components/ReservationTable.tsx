'use client';

import React from 'react';
import { Reservasi } from '@/lib/types';
import { formatRupiah, formatDateDisplay } from '@/lib/formatters';
import {
  Eye,
  Edit3,
  DollarSign,
  Star,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ReservationTableProps {
  reservations: Reservasi[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onViewDetail: (r: Reservasi) => void;
  onEdit: (r: Reservasi) => void;
  onOpenHpp: (r: Reservasi) => void;
  onOpenReview: (r: Reservasi) => void;
  onDelete?: (r: Reservasi) => void;
  isIntern?: boolean;
  isLoading: boolean;
}

export default function ReservationTable({
  reservations,
  total,
  page,
  limit,
  onPageChange,
  onViewDetail,
  onEdit,
  onOpenHpp,
  onOpenReview,
  onDelete,
  isIntern = false,
  isLoading,
}: ReservationTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;

  // Render badge status trip
  const renderTripBadge = (r: Reservasi) => {
    const status = r.computedStatusTrip || r.statusTrip;

    if (status === 'Finish (Review)') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Finish (Review)
        </span>
      );
    }
    if (status === 'Finish (On Review)' || status === 'Finish (Un Review)') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Finish (On Review)
        </span>
      );
    }
    if (status === 'On Going') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          On Going (Hari H)
        </span>
      );
    }
    if (status === 'On Schedule (Ready)') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
          On Schedule (Ready)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20 whitespace-nowrap">
        On Schedule (Not Ready)
      </span>
    );
  };

  // Render badge payment
  const renderPaymentBadge = (r: Reservasi) => {
    if (r.statusPayment === 'Lunas') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 uppercase tracking-wider">
          LUNAS
        </span>
      );
    }
    if (r.statusPayment === 'Cancel') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 uppercase tracking-wider">
          CANCEL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 uppercase tracking-wider">
        {r.statusPayment || 'DP 1'}
      </span>
    );
  };

  // Helper page numbers
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden flex flex-col">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-black text-base sm:text-lg tracking-tight text-foreground">
            Daftar Reservasi Masuk
          </h3>
          <p className="text-xs text-muted-foreground font-semibold">
            Menampilkan {reservations.length} dari total {total} reservasi aktif
          </p>
        </div>

        {/* Legend Ringkas */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border/60 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Kolom U: Status Trip
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Kolom AC: Status Bayar
          </span>
        </div>
      </div>

      {/* Mobile Card Feed (Screen < md) */}
      <div className="block md:hidden divide-y divide-border/60 min-h-[300px]">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs font-semibold text-muted-foreground">
                Sinkronisasi data Google Sheets...
              </span>
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <Search size={18} />
              </div>
              <span className="text-sm font-bold text-foreground">Tidak ada reservasi ditemukan</span>
              <span className="text-xs text-muted-foreground">Coba ubah kata kunci atau bersihkan filter yang aktif.</span>
            </div>
          </div>
        ) : (
          reservations.map((r) => {
            const cleanWa = (r.whatsapp || '').replace(/[^0-9]/g, '');
            const waLink = cleanWa.startsWith('0')
              ? `https://wa.me/62${cleanWa.substring(1)}`
              : `https://wa.me/${cleanWa}`;

            return (
              <div
                key={r.rowNumber}
                onClick={() => onViewDetail(r)}
                className="p-3.5 space-y-2.5 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer"
              >
                {/* Header Card: Kode, PIC, & Status Bayar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      {r.kode}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      PIC: <strong className="text-foreground">{r.picAgen || '-'}</strong>
                    </span>
                  </div>
                  <div className="shrink-0">
                    {renderPaymentBadge(r)}
                  </div>
                </div>

                {/* Tamu, Paket & Jadwal */}
                <div>
                  <div className="text-xs sm:text-sm font-black text-foreground leading-snug">
                    {r.namaTamu}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                    {r.paket || '-'} • <strong className="text-foreground font-bold">{r.pax} Orang</strong>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDateDisplay(r.startTrip)}
                    {r.finishTrip && r.finishTrip !== r.startTrip && ` - ${formatDateDisplay(r.finishTrip)}`}
                    {' '}({r.trip ? `${r.trip} Hari` : '1 Hari'})
                  </div>
                </div>

                {/* Finansial Ringkas */}
                <div className="p-2 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block">
                      Nilai Order
                    </span>
                    <span className="font-mono font-black text-foreground">
                      {formatRupiah(r.nilaiOrder)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block">
                      Status Bayar
                    </span>
                    {renderPaymentBadge(r)}
                  </div>
                </div>

                {/* Status Trip & WA Link */}
                <div className="flex items-center justify-between pt-0.5">
                  <div>{renderTripBadge(r)}</div>
                  {r.whatsapp && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      <MessageCircle size={13} />
                      <span>{r.whatsapp}</span>
                    </a>
                  )}
                </div>

                {/* Quick Action Buttons (Touch targets) */}
                <div
                  className={`pt-2 border-t border-border/50 grid ${onDelete && !isIntern ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onViewDetail(r)}
                    className="py-2 px-1 rounded-xl border border-border text-xs font-bold text-foreground bg-card hover:bg-muted active:scale-95 transition-all text-center flex items-center justify-center gap-1 min-h-[40px] shadow-2xs cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Detail</span>
                  </button>
                  <button
                    onClick={() => onEdit(r)}
                    className="py-2 px-1 rounded-xl border border-border text-xs font-bold text-primary bg-card hover:bg-primary/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1 min-h-[40px] shadow-2xs cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onOpenHpp(r)}
                    className="py-2 px-1 rounded-xl border border-border text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-card hover:bg-emerald-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1 min-h-[40px] shadow-2xs cursor-pointer"
                  >
                    <DollarSign size={13} />
                    <span>HPP</span>
                  </button>
                  {onDelete && !isIntern && (
                    <button
                      onClick={() => onDelete(r)}
                      className="py-2 px-1 rounded-xl border border-rose-300 dark:border-rose-900/60 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all text-center flex items-center justify-center gap-1 min-h-[40px] shadow-2xs cursor-pointer"
                      title="Hapus Reservasi"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Responsive Wrapper */}
      <div className="hidden md:block overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <th className="py-3.5 px-5 w-[14%]">ID Trip / Kode</th>
              <th className="py-3.5 px-5 w-[22%]">Tamu &amp; Kontak</th>
              <th className="py-3.5 px-5 w-[15%]">Jadwal Trip</th>
              <th className="py-3.5 px-5 w-[15%]">Paket &amp; Pax</th>
              <th className="py-3.5 px-5 w-[16%]">Finansial</th>
              <th className="py-3.5 px-5 w-[14%]">Status Operasional</th>
              <th className="py-3.5 px-5 text-center w-[10%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/55 text-xs font-semibold">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Sinkronisasi data Google Sheets API...
                    </span>
                  </div>
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                      <Search size={18} />
                    </div>
                    <span className="text-sm font-bold text-foreground">Tidak ada reservasi ditemukan</span>
                    <span className="text-xs text-muted-foreground">Coba ubah kata kunci atau bersihkan filter yang aktif.</span>
                  </div>
                </td>
              </tr>
            ) : (
              reservations.map((r) => {
                const cleanWa = (r.whatsapp || '').replace(/[^0-9]/g, '');
                const waLink = cleanWa.startsWith('0')
                  ? `https://wa.me/62${cleanWa.substring(1)}`
                  : `https://wa.me/${cleanWa}`;

                return (
                  <tr
                    key={r.rowNumber}
                    onClick={() => onViewDetail(r)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    {/* ID / Kode */}
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-xs text-primary group-hover:underline">
                        {r.kode}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        PIC: <span className="text-foreground">{r.picAgen || '-'}</span>
                      </div>
                    </td>

                    {/* Tamu & Kontak */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-foreground text-xs leading-tight">
                        {r.namaTamu}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {r.whatsapp && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-bold"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{r.whatsapp}</span>
                          </a>
                        )}
                        {r.instagram && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            @{r.instagram}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Jadwal Trip */}
                    <td className="py-3.5 px-5">
                      <div className="text-xs font-semibold text-foreground">
                        {formatDateDisplay(r.startTrip)}
                        {r.finishTrip && r.finishTrip !== r.startTrip && (
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            - {formatDateDisplay(r.finishTrip)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {r.trip ? `${r.trip} Hari` : '1 Hari'}
                      </div>
                    </td>

                    {/* Paket & Pax */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-foreground text-xs truncate max-w-[170px]" title={r.paket}>
                        {r.paket || '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        <span className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">
                          {r.pax}
                        </span>{' '}
                        Pax
                      </div>
                    </td>

                    {/* Finansial */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-extrabold text-xs text-orange-600 dark:text-orange-400">
                          {formatRupiah(r.nilaiOrder)}
                        </span>
                        {renderPaymentBadge(r)}
                      </div>

                      {/* Notifikasi suruh update HPP jika ada overpayment */}
                      {r.needsHppUpdate && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>Update HPP!</span>
                        </div>
                      )}
                    </td>

                    {/* Status Operasional (Kolom U) */}
                    <td className="py-3.5 px-5">
                      {renderTripBadge(r)}

                      {/* Review Link status */}
                      <div className="mt-1 flex items-center gap-1">
                        {r.linkReview ? (
                          <a
                            href={r.linkReview}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                            Review Terisi
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenReview(r);
                            }}
                            className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            + Input Review
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onViewDetail(r)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
                          title="Lihat Detail Lengkap"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          onClick={() => onEdit(r)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 text-primary hover:bg-primary/10 transition-all cursor-pointer shadow-2xs"
                          title="Edit Reservasi"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          onClick={() => onOpenHpp(r)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer shadow-2xs"
                          title="Update Status &amp; HPP"
                        >
                          <DollarSign size={13} />
                        </button>

                        {onDelete && !isIntern && (
                          <button
                            onClick={() => onDelete(r)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                            title="Hapus Reservasi"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-3.5 px-5 bg-card">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-semibold">
            Menampilkan <strong className="text-foreground">{total > 0 ? startIndex + 1 : 0}</strong>–
            <strong className="text-foreground">{Math.min(startIndex + limit, total)}</strong> dari{' '}
            <strong className="text-foreground">{total.toLocaleString('id-ID')}</strong> reservasi
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="h-8 w-8 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={`h-8 w-8 text-xs font-bold rounded-lg transition-all ${
                    page === p
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={page === totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="h-8 w-8 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
