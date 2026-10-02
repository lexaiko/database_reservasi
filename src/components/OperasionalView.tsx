'use client';

import React, { useState } from 'react';
import { Reservasi } from '@/lib/types';
import { formatDateDisplay } from '@/lib/formatters';
import { CalendarDays, MapPin, Building, Users, Clock, Star, ExternalLink, CheckCircle } from 'lucide-react';

interface OperasionalViewProps {
  reservations: Reservasi[];
  onOpenReview: (r: Reservasi) => void;
  onViewDetail: (r: Reservasi) => void;
  onEdit: (r: Reservasi) => void;
  onEditCrewHotel?: (r: Reservasi) => void;
}

export const OperasionalView: React.FC<OperasionalViewProps> = ({
  reservations,
  onOpenReview,
  onViewDetail,
  onEdit,
  onEditCrewHotel,
}) => {
  const [filterType, setFilterType] = useState<'ongoing' | 'schedule' | 'review'>('ongoing');

  // Filter groups
  const onGoingTrips = reservations.filter(
    (r) => r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going'
  );

  const onScheduleTrips = reservations.filter(
    (r) =>
      (r.computedStatusTrip?.includes('Schedule') || r.statusTrip?.includes('Schedule')) &&
      r.statusTrip !== 'Cancel'
  );

  const reviewTrips = reservations.filter(
    (r) =>
      r.computedStatusTrip === 'Finish (On Review)' ||
      r.computedStatusTrip === 'Finish (Un Review)' ||
      r.statusTrip === 'Finish (On Review)' ||
      r.statusTrip === 'Finish (Un Review)'
  );

  const activeList =
    filterType === 'ongoing'
      ? onGoingTrips
      : filterType === 'schedule'
      ? onScheduleTrips
      : reviewTrips;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Tabs */}
      <div className="rounded-2xl bg-card border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Manajemen Jadwal Operasional &amp; Crew
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau trip hari H, kesiapan hotel dan armada, serta tindak lanjut review tamu
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setFilterType('ongoing')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterType === 'ongoing'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Hari H (On Going)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {onGoingTrips.length}
            </span>
          </button>

          <button
            onClick={() => setFilterType('schedule')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterType === 'schedule'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Mendatang (Schedule)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {onScheduleTrips.length}
            </span>
          </button>

          <button
            onClick={() => setFilterType('review')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterType === 'review'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Butuh Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {reviewTrips.length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs rounded-2xl bg-card border border-border">
            Tidak ada trip yang sedang berada pada status ini.
          </div>
        ) : (
          activeList.map((r) => (
            <div
              key={r.rowNumber}
              className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Row: Kode & Pax */}
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 font-mono font-bold text-primary text-xs">
                    {r.kode}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {r.pax} Orang • {r.paket}
                  </span>
                </div>

                {/* Tamu */}
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">{r.namaTamu}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)} ({r.trip || 1} Hari)
                    </span>
                  </div>
                </div>

                {/* Destinasi & Operasional */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Itinerary Destinasi
                    </span>
                    <div className="text-foreground font-semibold line-clamp-2">
                      {[r.day1, r.day2, r.day3, r.day4].filter(Boolean).join(' • ') || 'Belum diisi'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground block text-[10px]">Hotel (P)</span>
                      <strong className="text-foreground truncate block">{r.hotel || '-'}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground block text-[10px]">Crew (Q)</span>
                      <strong className="text-foreground truncate block">{r.crew || '-'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewDetail(r)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-xs font-bold transition-all"
                >
                  Detail
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => (onEditCrewHotel || onEdit)(r)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-xs font-bold transition-all cursor-pointer"
                  >
                    Edit Crew/Hotel
                  </button>

                  <button
                    onClick={() => onOpenReview(r)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1"
                    title="Input Google Review"
                  >
                    <Star className="w-3.5 h-3.5 fill-emerald-500" />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
