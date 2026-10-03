'use client';

import React, { useState, useMemo } from 'react';
import { Reservasi } from '@/lib/types';
import { formatDateDisplay, normalizeDateToYMD } from '@/lib/formatters';
import {
  CalendarDays,
  Calendar,
  Clock,
  Users,
  MapPin,
  Building,
  Car,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MessageCircle,
  LayoutGrid,
  ListFilter,
  UserCheck,
} from 'lucide-react';

interface OperasionalViewProps {
  reservations: Reservasi[];
  onOpenReview: (r: Reservasi) => void;
  onViewDetail: (r: Reservasi) => void;
  onEdit: (r: Reservasi) => void;
  onEditCrewHotel?: (r: Reservasi) => void;
  assignedPic?: string;
}

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const NAMA_HARI_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggalLengkap(ymd: string): string {
  if (!ymd || !ymd.includes('-')) return ymd || '-';
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const hari = NAMA_HARI_FULL[date.getDay()];
  const bulan = NAMA_BULAN[m - 1];
  return `${hari}, ${d} ${bulan} ${y}`;
}

function getTripDayInfo(r: Reservasi, targetYmd: string): string {
  const startYmd = r.startTrip || r.finishTrip;
  const finishYmd = r.finishTrip || r.startTrip;
  if (!startYmd) return 'Jadwal Trip';

  if (startYmd === targetYmd && finishYmd === targetYmd) {
    return 'Trip 1 Hari';
  }

  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ty, tm, td] = targetYmd.split('-').map(Number);
  const [fy, fm, fd] = (finishYmd || startYmd).split('-').map(Number);

  const startDate = new Date(sy, sm - 1, sd);
  const targetDate = new Date(ty, tm - 1, td);
  const finishDate = new Date(fy, fm - 1, fd);

  const diffTime = targetDate.getTime() - startDate.getTime();
  const dayNumber = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const totalDays = Math.max(1, Math.floor((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  if (dayNumber === 1) return `Hari ke-1 (Start - ${totalDays} Hari)`;
  if (targetYmd === finishYmd) return `Hari Terakhir (Finish - ${totalDays} Hari)`;
  return `Hari ke-${dayNumber} dari ${totalDays} Hari`;
}

function getItineraryForDay(r: Reservasi, targetYmd: string): string {
  const startYmd = r.startTrip || r.finishTrip;
  if (!startYmd) return [r.day1, r.day2, r.day3, r.day4].filter(Boolean).join(' • ') || '-';

  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ty, tm, td] = targetYmd.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const targetDate = new Date(ty, tm - 1, td);

  const diffTime = targetDate.getTime() - startDate.getTime();
  const dayNumber = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  if (dayNumber === 1 && r.day1) return `Day 1: ${r.day1}`;
  if (dayNumber === 2 && r.day2) return `Day 2: ${r.day2}`;
  if (dayNumber === 3 && r.day3) return `Day 3: ${r.day3}`;
  if (dayNumber === 4 && r.day4) return `Day 4: ${r.day4}`;

  return [r.day1, r.day2, r.day3, r.day4].filter(Boolean).join(' • ') || '-';
}

function isTripOnDate(r: Reservasi, dateYmd: string): boolean {
  const start = r.startTrip || r.finishTrip;
  const finish = r.finishTrip || r.startTrip;
  if (!start && !finish) return false;
  const s = start || finish;
  const f = finish || start;
  return dateYmd >= s && dateYmd <= f;
}

export const OperasionalView: React.FC<OperasionalViewProps> = ({
  reservations,
  onOpenReview,
  onViewDetail,
  onEdit,
  onEditCrewHotel,
  assignedPic,
}) => {
  // Main view mode: 'calendar' (default, modern interactive) or 'cards' (traditional list)
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');

  // Today reference
  const now = new Date();
  const todayYmd = normalizeDateToYMD(now);

  // Calendar Date State (default to today's year and month)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return now.getFullYear() || 2026;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return now.getMonth() + 1; // 1-12
  });
  const [selectedDateYmd, setSelectedDateYmd] = useState<string>(() => todayYmd);

  // Filters for Calendar
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [picFilter, setPicFilter] = useState<string>(assignedPic || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [agendaMode, setAgendaMode] = useState<'day' | 'month'>('day');

  // Sync picFilter if assignedPic changes
  React.useEffect(() => {
    if (assignedPic) {
      setPicFilter(assignedPic);
    }
  }, [assignedPic]);

  // Filters for Cards Mode
  const [cardTab, setCardTab] = useState<'ongoing' | 'schedule' | 'review'>('ongoing');

  // Available PICs
  const availablePics = useMemo(() => {
    const set = new Set<string>();
    reservations.forEach((r) => {
      if (r.picAgen) set.add(r.picAgen.trim());
    });
    return Array.from(set).sort();
  }, [reservations]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setSelectedDateYmd(todayYmd);
    setAgendaMode('day');
  };

  // Filtered reservations pool
  const filteredReservations = useMemo(() => {
    let list = reservations;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.namaTamu.toLowerCase().includes(q) ||
          r.kode.toLowerCase().includes(q) ||
          (r.paket && r.paket.toLowerCase().includes(q)) ||
          (r.whatsapp && r.whatsapp.includes(q)) ||
          (r.hotel && r.hotel.toLowerCase().includes(q)) ||
          (r.crew && r.crew.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'ongoing') {
        list = list.filter((r) => r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going');
      } else if (statusFilter === 'schedule') {
        list = list.filter(
          (r) =>
            (r.computedStatusTrip?.includes('Schedule') || r.statusTrip?.includes('Schedule')) &&
            r.statusTrip !== 'Cancel'
        );
      } else if (statusFilter === 'finish') {
        list = list.filter(
          (r) =>
            r.computedStatusTrip?.includes('Finish') ||
            r.statusTrip?.includes('Finish')
        );
      } else if (statusFilter === 'cancel') {
        list = list.filter((r) => r.statusTrip === 'Cancel' || r.statusTrip === 'Cancel / Refund');
      }
    }

    if (picFilter !== 'all') {
      list = list.filter((r) => r.picAgen.toLowerCase() === picFilter.toLowerCase());
    }

    return list;
  }, [reservations, searchQuery, statusFilter, picFilter]);

  // Current Month Start & End String for YMD check
  const monthStartStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const lastDayInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthEndStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDayInMonth).padStart(2, '0')}`;

  // Monthly trips (trips active at any point in this month)
  const monthTrips = useMemo(() => {
    return filteredReservations.filter((r) => {
      const start = r.startTrip || r.finishTrip;
      const finish = r.finishTrip || r.startTrip;
      if (!start && !finish) return false;
      const s = start || finish;
      const f = finish || start;
      return s <= monthEndStr && f >= monthStartStr;
    });
  }, [filteredReservations, monthStartStr, monthEndStr]);

  // Month Statistics
  const monthStats = useMemo(() => {
    const totalTrips = monthTrips.length;
    const totalPax = monthTrips.reduce((acc, r) => acc + (r.pax || 0), 0);
    const ongoingTrips = monthTrips.filter(
      (r) => r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going'
    ).length;
    const missingHotelOrCrew = monthTrips.filter(
      (r) => !r.hotel?.trim() || !r.crew?.trim()
    ).length;

    return { totalTrips, totalPax, ongoingTrips, missingHotelOrCrew };
  }, [monthTrips]);

  // Trips active on the specifically selected date
  const selectedDateTrips = useMemo(() => {
    if (!selectedDateYmd) return [];
    return filteredReservations.filter((r) => isTripOnDate(r, selectedDateYmd));
  }, [filteredReservations, selectedDateYmd]);

  // Build the 7-column calendar matrix (Monday to Sunday)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Convert so Monday = 0, Tuesday = 1, ..., Sunday = 6
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days = [];
    const prevMonthLastDate = new Date(selectedYear, selectedMonth - 1, 0).getDate();

    // Previous month filler days
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevM = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevY = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const ymd = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const trips = filteredReservations.filter((r) => isTripOnDate(r, ymd));

      days.push({
        dayNumber: dayNum,
        ymd,
        isCurrentMonth: false,
        isToday: ymd === todayYmd,
        isSelected: ymd === selectedDateYmd,
        trips,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayInMonth; d++) {
      const ymd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const trips = filteredReservations.filter((r) => isTripOnDate(r, ymd));

      days.push({
        dayNumber: d,
        ymd,
        isCurrentMonth: true,
        isToday: ymd === todayYmd,
        isSelected: ymd === selectedDateYmd,
        trips,
      });
    }

    // Next month filler days (fill up to 35 or 42 grid slots)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let n = 1; n <= remainingSlots; n++) {
      const nextM = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextY = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const ymd = `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const trips = filteredReservations.filter((r) => isTripOnDate(r, ymd));

      days.push({
        dayNumber: n,
        ymd,
        isCurrentMonth: false,
        isToday: ymd === todayYmd,
        isSelected: ymd === selectedDateYmd,
        trips,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, lastDayInMonth, filteredReservations, todayYmd, selectedDateYmd]);

  // Card view list logic (for traditional mode)
  const onGoingTrips = useMemo(
    () => reservations.filter((r) => r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going'),
    [reservations]
  );
  const onScheduleTrips = useMemo(
    () =>
      reservations.filter(
        (r) =>
          (r.computedStatusTrip?.includes('Schedule') || r.statusTrip?.includes('Schedule')) &&
          r.statusTrip !== 'Cancel'
      ),
    [reservations]
  );
  const reviewTrips = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.computedStatusTrip === 'Finish (On Review)' ||
          r.computedStatusTrip === 'Finish (Un Review)' ||
          r.statusTrip === 'Finish (On Review)' ||
          r.statusTrip === 'Finish (Un Review)'
      ),
    [reservations]
  );
  const activeCardList =
    cardTab === 'ongoing' ? onGoingTrips : cardTab === 'schedule' ? onScheduleTrips : reviewTrips;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. TOP HEADER & VIEW MODE SWITCHER */}
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Manajemen Jadwal Operasional &amp; Crew
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoring kalender trip, kesiapan hotel, crew/driver, serta agenda operasional hari H
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Kalender vs Daftar Kartu */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-bold self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
              viewMode === 'calendar'
                ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar size={15} />
            <span>Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
              viewMode === 'cards'
                ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid size={15} />
            <span>Daftar Kartu</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: KALENDER OPERASIONAL INTERAKTIF (DESKTOP & MOBILE)     */}
      {/* ============================================================== */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar for Selected Month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Trip {NAMA_BULAN[selectedMonth - 1]}
                </span>
                <span className="text-lg sm:text-2xl font-black text-foreground tabular-nums block mt-0.5">
                  {monthStats.totalTrips} Trip
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <CalendarDays size={18} />
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Pax Bulan Ini
                </span>
                <span className="text-lg sm:text-2xl font-black text-foreground tabular-nums block mt-0.5">
                  {monthStats.totalPax} Orang
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Hari H (On Going)
                </span>
                <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
                  {monthStats.ongoingTrips} Trip
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Perlu Crew/Hotel
                </span>
                <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums block mt-0.5">
                  {monthStats.missingHotelOrCrew} Trip
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
            </div>
          </div>

          {/* Calendar Controls & Month Switcher Card */}
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-black text-foreground min-w-[150px] text-center tracking-tight">
                    {NAMA_BULAN[selectedMonth - 1]} {selectedYear}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="ml-2 px-3 py-1.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-extrabold text-foreground transition-all cursor-pointer shadow-2xs min-h-[36px]"
                >
                  Hari Ini
                </button>
              </div>

              {/* Search & Status Filters */}
              <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari tamu / kode / paket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="ongoing">Hari H (On Going)</option>
                    <option value="schedule">On Schedule</option>
                    <option value="finish">Selesai (Finish)</option>
                    <option value="cancel">Cancel</option>
                  </select>

                  {assignedPic ? (
                    <div className="h-9 px-3 rounded-xl border border-border bg-muted/60 text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0">
                      <UserCheck size={12} className="text-orange-500" />
                      <span>PIC: {assignedPic}</span>
                    </div>
                  ) : (
                    <select
                      value={picFilter}
                      onChange={(e) => setPicFilter(e.target.value)}
                      className="h-9 px-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none"
                    >
                      <option value="all">Semua PIC</option>
                      {availablePics.map((pic) => (
                        <option key={pic} value={pic}>
                          {pic}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* DESKTOP CALENDAR GRID (Screen >= md)                           */}
            {/* ============================================================== */}
            <div className="hidden md:block">
              {/* Day Headers (Senin s/d Minggu) */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {NAMA_HARI.map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={`py-2 text-xs font-black uppercase tracking-wider ${
                      idx >= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Days Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell) => {
                  const hasTrips = cell.trips.length > 0;
                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;

                  return (
                    <div
                      key={cell.ymd}
                      onClick={() => {
                        setSelectedDateYmd(cell.ymd);
                        setAgendaMode('day');
                      }}
                      className={`min-h-[115px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        cell.isCurrentMonth
                          ? isSelected
                            ? 'bg-primary/5 border-primary shadow-xs ring-2 ring-primary/20'
                            : isToday
                            ? 'bg-orange-500/5 border-orange-500/40 hover:border-orange-500'
                            : 'bg-card border-border hover:border-border/90 hover:bg-muted/30'
                          : 'bg-muted/20 border-border/40 opacity-40 hover:opacity-70'
                      }`}
                    >
                      {/* Cell Header: Day Number & Count Badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : isSelected
                              ? 'bg-primary text-primary-foreground font-black'
                              : 'text-foreground'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {hasTrips && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-muted text-foreground border border-border/70">
                            {cell.trips.length} Trip
                          </span>
                        )}
                      </div>

                      {/* Cell Body: Trip Chips */}
                      <div className="space-y-1 mt-1.5 flex-1">
                        {cell.trips.slice(0, 2).map((r) => {
                          const isOngoing = r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going';
                          const isCancelled = r.statusTrip === 'Cancel' || r.statusTrip === 'Cancel / Refund';

                          return (
                            <div
                              key={r.kode}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(r);
                              }}
                              className={`p-1 px-1.5 rounded-lg text-[10px] font-bold truncate transition-all cursor-pointer hover:scale-101 flex items-center justify-between gap-1 ${
                                isCancelled
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 line-through'
                                  : isOngoing
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/20'
                              }`}
                              title={`${r.namaTamu} (${r.pax} Pax) - ${r.paket} | PIC: ${r.picAgen}`}
                            >
                              <span className="truncate">{r.namaTamu}</span>
                              <span className="text-[9px] opacity-80 shrink-0 font-mono">
                                {r.pax}p
                              </span>
                            </div>
                          );
                        })}

                        {cell.trips.length > 2 && (
                          <div className="text-[10px] font-black text-primary text-center pt-0.5">
                            +{cell.trips.length - 2} trip lainnya
                          </div>
                        )}
                      </div>

                      {/* Bottom status dot line */}
                      {hasTrips && (
                        <div className="flex items-center gap-1 pt-1 justify-end">
                          {cell.trips.some((t) => t.computedStatusTrip === 'On Going' || t.statusTrip === 'On Going') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ada trip On Going" />
                          )}
                          {cell.trips.some((t) => !t.hotel || !t.crew) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Belum lengkap crew/hotel" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================== */}
            {/* MOBILE CALENDAR MATRIX (Screen < md) - ERGONOMIC TOUCH TARGETS */}
            {/* ============================================================== */}
            <div className="block md:hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {NAMA_HARI.map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={`py-1 text-[11px] font-black uppercase ${
                      idx >= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Day Touch Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell) => {
                  const hasTrips = cell.trips.length > 0;
                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;

                  return (
                    <button
                      key={cell.ymd}
                      type="button"
                      onClick={() => {
                        setSelectedDateYmd(cell.ymd);
                        setAgendaMode('day');
                      }}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-black shadow-xs'
                          : isToday
                          ? 'bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400 font-black'
                          : cell.isCurrentMonth
                          ? 'bg-card border-border text-foreground hover:bg-muted'
                          : 'bg-muted/15 border-border/30 text-muted-foreground/40'
                      }`}
                    >
                      <span className="text-xs font-black">{cell.dayNumber}</span>

                      {/* Indicator Dots/Pill on Mobile */}
                      {hasTrips && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : cell.trips.some((t) => t.computedStatusTrip === 'On Going' || t.statusTrip === 'On Going')
                                ? 'bg-emerald-500'
                                : 'bg-orange-500'
                            }`}
                          />
                          {cell.trips.length > 1 && (
                            <span
                              className={`text-[9px] font-black leading-none ${
                                isSelected ? 'text-white' : 'text-foreground'
                              }`}
                            >
                              {cell.trips.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* DAILY AGENDA & OPERATIONAL CARDS (DESKTOP & MOBILE)            */}
          {/* ============================================================== */}
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-xs space-y-4">
            {/* Agenda Header & Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    {agendaMode === 'day'
                      ? `Jadwal: ${formatTanggalLengkap(selectedDateYmd)}`
                      : `Semua Jadwal Trip ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {agendaMode === 'day'
                      ? `${selectedDateTrips.length} trip aktif pada tanggal ini`
                      : `${monthTrips.length} total trip terjadwal sepanjang bulan`}
                  </p>
                </div>
              </div>

              {/* Toggle Agenda Mode (Selected Day vs All Month) */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAgendaMode('day')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    agendaMode === 'day'
                      ? 'bg-card text-foreground font-black shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Hari Ini / Terpilih ({selectedDateTrips.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaMode('month')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    agendaMode === 'month'
                      ? 'bg-card text-foreground font-black shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Satu Bulan ({monthTrips.length})</span>
                </button>
              </div>
            </div>

            {/* List of Trip Cards for this date or month */}
            {(() => {
              const displayList = agendaMode === 'day' ? selectedDateTrips : monthTrips;

              if (displayList.length === 0) {
                return (
                  <div className="py-12 px-4 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <Calendar size={18} />
                    </div>
                    <h5 className="text-sm font-bold text-foreground">
                      Tidak ada jadwal trip pada tanggal ini.
                    </h5>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Pilih tanggal lain yang memiliki tanda titik trip pada kalender di atas, atau klik &quot;Satu Bulan&quot; untuk melihat seluruh trip bulan {NAMA_BULAN[selectedMonth - 1]}.
                    </p>
                    {agendaMode === 'day' && monthTrips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAgendaMode('month')}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-2xs cursor-pointer"
                      >
                        Lihat Semua Trip Bulan Ini ({monthTrips.length})
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {displayList.map((r) => {
                    const isOngoing = r.computedStatusTrip === 'On Going' || r.statusTrip === 'On Going';
                    const tripDayInfo = getTripDayInfo(r, selectedDateYmd);
                    const todayItinerary = getItineraryForDay(r, selectedDateYmd);
                    const cleanWa = (r.whatsapp || '').replace(/[^0-9]/g, '');
                    const waLink = cleanWa.startsWith('0')
                      ? `https://wa.me/62${cleanWa.substring(1)}`
                      : `https://wa.me/${cleanWa}`;

                    return (
                      <div
                        key={r.kode || r.rowNumber}
                        className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-3.5 hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
                      >
                        <div className="space-y-3">
                          {/* Top Row: Kode, PIC & Status Badge */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-mono font-extrabold text-xs border border-orange-200/60 dark:border-orange-900/40">
                                {r.kode}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                PIC: <strong className="text-foreground">{r.picAgen || '-'}</strong>
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isOngoing
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                                  : r.statusTrip === 'Cancel'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                              }`}
                            >
                              {r.computedStatusTrip || r.statusTrip}
                            </span>
                          </div>

                          {/* Guest Name & Operational Schedule */}
                          <div>
                            <h5 className="font-black text-sm text-foreground tracking-tight leading-snug">
                              {r.namaTamu}
                            </h5>
                            <div className="text-xs text-muted-foreground font-semibold mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-foreground font-bold">{r.paket}</span>
                              <span>•</span>
                              <span>{r.pax} Orang</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock size={12} className="text-orange-500 shrink-0" />
                              <span>
                                {formatDateDisplay(r.startTrip)} - {formatDateDisplay(r.finishTrip)} ({r.trip ? `${r.trip} Hari` : '1 Hari'})
                              </span>
                            </div>
                          </div>

                          {/* Day indicator banner if looking at specific day */}
                          {agendaMode === 'day' && (
                            <div className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-300 font-extrabold text-[11px] border border-orange-500/20">
                              {tripDayInfo}
                            </div>
                          )}

                          {/* Operational Details (Hotel, Crew, Mepo, Itinerary) */}
                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Rute Destinasi
                              </span>
                              <div className="text-foreground font-semibold text-xs line-clamp-2">
                                {agendaMode === 'day' ? todayItinerary : [r.day1, r.day2, r.day3, r.day4].filter(Boolean).join(' • ') || '-'}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 rounded-xl bg-muted/30 border border-border/50">
                                <span className="text-muted-foreground block text-[10px] font-bold">Hotel (P)</span>
                                <strong className="text-foreground truncate block font-bold">
                                  {r.hotel || <span className="text-amber-600 italic">Belum diisi</span>}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-muted/30 border border-border/50">
                                <span className="text-muted-foreground block text-[10px] font-bold">Crew/Driver (Q)</span>
                                <strong className="text-foreground truncate block font-bold">
                                  {r.crew || <span className="text-amber-600 italic">Belum diisi</span>}
                                </strong>
                              </div>
                            </div>

                            {r.mepo && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                                <MapPin size={12} className="text-rose-500 shrink-0" />
                                <span className="truncate">Meeting Point: <strong className="text-foreground">{r.mepo}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Ergonomic 40px Touch Targets */}
                        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDetail(r)}
                            className="py-2 px-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-98"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => (onEditCrewHotel || onEdit)(r)}
                              className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1 active:scale-98"
                              title="Update Hotel & Crew Driver"
                            >
                              <Edit3 size={13} />
                              <span className="hidden sm:inline">Crew/Hotel</span>
                              <span className="sm:hidden">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenReview(r)}
                              className="py-2 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1 cursor-pointer"
                              title="Input Google Review Tamu"
                            >
                              <Star size={13} className="fill-emerald-500 text-emerald-500" />
                              <span className="hidden sm:inline">Review</span>
                            </button>

                            {r.whatsapp && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all min-h-[40px] flex items-center justify-center"
                                title={`Hubungi WA ${r.namaTamu}`}
                              >
                                <MessageCircle size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: DAFTAR KARTU OPERASIONAL (TRADITIONAL MODE)            */}
      {/* ============================================================== */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* Card Tab Selectors */}
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-bold">
            <button
              onClick={() => setCardTab('ongoing')}
              className={`py-2.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center min-h-[40px] active:scale-95 cursor-pointer ${
                cardTab === 'ongoing'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline">Hari H (On Going)</span>
              <span className="sm:hidden">Hari H</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {onGoingTrips.length}
              </span>
            </button>

            <button
              onClick={() => setCardTab('schedule')}
              className={`py-2.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center min-h-[40px] active:scale-95 cursor-pointer ${
                cardTab === 'schedule'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline">Mendatang (Schedule)</span>
              <span className="sm:hidden">Schedule</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {onScheduleTrips.length}
              </span>
            </button>

            <button
              onClick={() => setCardTab('review')}
              className={`py-2.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center min-h-[40px] active:scale-95 cursor-pointer ${
                cardTab === 'review'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline">Butuh Review</span>
              <span className="sm:hidden">Review</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {reviewTrips.length}
              </span>
            </button>
          </div>

          {/* Grid of Operation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCardList.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground text-xs rounded-2xl bg-card border border-border">
                Tidak ada trip yang sedang berada pada status ini.
              </div>
            ) : (
              activeCardList.map((r) => (
                <div
                  key={r.rowNumber}
                  className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
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
                      type="button"
                      onClick={() => onViewDetail(r)}
                      className="px-3 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-bold transition-all min-h-[40px] flex items-center justify-center cursor-pointer"
                    >
                      Detail
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => (onEditCrewHotel || onEdit)(r)}
                        className="px-3 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                      >
                        Edit Crew/Hotel
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenReview(r)}
                        className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[40px]"
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
      )}
    </div>
  );
};
