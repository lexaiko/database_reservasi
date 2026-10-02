'use client';

import React, { useState } from 'react';
import { Reservasi } from '@/lib/types';
import { formatRupiah, formatDateDisplay } from '@/lib/formatters';
import { HandCoins, MessageCircle, DollarSign, Calendar, Search, AlertCircle } from 'lucide-react';

interface PiutangViewProps {
  reservations: Reservasi[];
  onOpenHpp: (r: Reservasi) => void;
  onViewDetail: (r: Reservasi) => void;
}

export const PiutangView: React.FC<PiutangViewProps> = ({
  reservations,
  onOpenHpp,
  onViewDetail,
}) => {
  const [search, setSearch] = useState('');

  // Saring tamu yang belum lunas
  const unpaidList = reservations
    .filter(
      (r) =>
        r.statusPayment !== 'Lunas' &&
        r.statusPayment !== 'Cancel' &&
        r.sisaPelunasan > 0 &&
        (r.kode.toLowerCase().includes(search.toLowerCase()) ||
          r.namaTamu.toLowerCase().includes(search.toLowerCase()) ||
          r.whatsapp.includes(search))
    )
    .sort((a, b) => {
      const da = new Date(a.startTrip || a.finishTrip).getTime() || 0;
      const db = new Date(b.startTrip || b.finishTrip).getTime() || 0;
      return da - db;
    });

  const totalPiutang = unpaidList.reduce((sum, r) => sum + r.sisaPelunasan, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl bg-card border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Manajemen Piutang Tamu Aktif
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Daftar tamu yang belum menyelesaikan pelunasan sebelum atau setelah trip
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Piutang Berjalan
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {formatRupiah(totalPiutang)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black">
            {unpaidList.length} Tamu
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari kode trip, nama tamu, atau nomor WhatsApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Piutang Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">ID Trip / Kode</th>
                <th className="py-3.5 px-4">Nama Tamu & Kontak</th>
                <th className="py-3.5 px-4">Jadwal Trip</th>
                <th className="py-3.5 px-4">Nilai Order</th>
                <th className="py-3.5 px-4">DP Terbayar</th>
                <th className="py-3.5 px-4">Sisa Tagihan</th>
                <th className="py-3.5 px-4 text-center">Aksi Tagih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-medium text-foreground">
              {unpaidList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Tidak ada piutang aktif saat ini. Seluruh tamu telah melunasi pembayaran.
                  </td>
                </tr>
              ) : (
                unpaidList.map((r) => {
                  const cleanWa = (r.whatsapp || '').replace(/[^0-9]/g, '');
                  const waNumber = cleanWa.startsWith('0') ? `62${cleanWa.substring(1)}` : cleanWa;
                  const waText = encodeURIComponent(
                    `Halo Kak ${r.namaTamu}, perkenalkan saya admin TripBanyuwangi. Mengonfirmasi jadwal trip [${r.kode} - ${r.paket}] pada tanggal ${formatDateDisplay(r.startTrip)}. Untuk sisa pelunasan tercatat sebesar ${formatRupiah(r.sisaPelunasan)}. Terima kasih Kak 🙏`
                  );
                  const waLink = `https://wa.me/${waNumber}?text=${waText}`;

                  return (
                    <tr key={r.rowNumber} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary">{r.kode}</span>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          PIC: {r.picAgen || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{r.namaTamu}</div>
                        <div className="text-[11px] text-muted-foreground">{r.whatsapp || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{formatDateDisplay(r.startTrip)}</div>
                        <div className="text-[10px] text-muted-foreground">{r.paket}</div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-bold">
                        {formatRupiah(r.nilaiOrder)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatRupiah(r.dp)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                        {formatRupiah(r.sisaPelunasan)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          {r.whatsapp && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                              title="Kirim template tagihan pelunasan via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Ingatkan WA</span>
                            </a>
                          )}

                          <button
                            onClick={() => onOpenHpp(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all"
                            title="Update Pelunasan & HPP"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Lunaskan</span>
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
      </div>
    </div>
  );
};
