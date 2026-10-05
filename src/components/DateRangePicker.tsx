'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string, presetType?: string) => void;
  presetType?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  presetType = 'ALL',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dateFilterType, setDateFilterType] = useState<string>(presetType);

  const [currentDate, setCurrentDate] = useState(() => {
    if (startDate) return new Date(startDate);
    return new Date();
  });
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setDateFilterType(presetType);
  }, [startDate, endDate, presetType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleDayClick = (date: Date) => {
    const clickedStr = formatDateString(date);

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedStr);
      setTempEnd('');
    } else {
      if (clickedStr < tempStart) {
        setTempStart(clickedStr);
      } else {
        setTempEnd(clickedStr);
      }
    }
  };

  const applyPreset = (type: string) => {
    const today = new Date();
    const todayStr = formatDateString(today);

    if (type === 'ALL') {
      onChange('', '', 'ALL');
      setIsOpen(false);
    } else if (type === 'TODAY') {
      onChange(todayStr, todayStr, 'TODAY');
      setIsOpen(false);
    } else if (type === 'YESTERDAY') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesStr = formatDateString(yesterday);
      onChange(yesStr, yesStr, 'YESTERDAY');
      setIsOpen(false);
    } else if (type === 'WEEK') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 6);
      const lwStr = formatDateString(lastWeek);
      onChange(lwStr, todayStr, 'WEEK');
      setIsOpen(false);
    } else if (type === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const fdStr = formatDateString(firstDay);
      const ldStr = formatDateString(lastDay);
      onChange(fdStr, ldStr, 'THIS_MONTH');
      setIsOpen(false);
    } else if (type === 'LAST_MONTH') {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLm = new Date(today.getFullYear(), today.getMonth(), 0);
      const fdStr = formatDateString(lm);
      const ldStr = formatDateString(lastDayLm);
      onChange(fdStr, ldStr, 'LAST_MONTH');
      setIsOpen(false);
    } else if (type === 'MONTH') {
      const last30 = new Date();
      last30.setDate(today.getDate() - 29);
      const lmStr = formatDateString(last30);
      onChange(lmStr, todayStr, 'MONTH');
      setIsOpen(false);
    } else if (type === 'THIS_YEAR') {
      const y = today.getFullYear();
      onChange(`${y}-01-01`, `${y}-12-31`, 'THIS_YEAR');
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempStart) {
      const finalEnd = tempEnd || tempStart;
      onChange(tempStart, finalEnd, 'CUSTOM');
      setIsOpen(false);
    }
  };

  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = parseInt(parts[2], 10);
    const m = months[parseInt(parts[1], 10) - 1];
    const y = parts[0].slice(-2);
    return `${d} ${m} '${y}`;
  };

  const getDisplayText = () => {
    if (presetType === 'ALL' || (!startDate && !endDate)) return 'Semua Waktu (2026)';
    if (presetType === 'TODAY') return 'Hari Ini';
    if (presetType === 'YESTERDAY') return 'Kemarin';
    if (presetType === 'WEEK') return '7 Hari Terakhir';
    if (presetType === 'THIS_MONTH') return 'Bulan Ini';
    if (presetType === 'LAST_MONTH') return 'Bulan Lalu';
    if (presetType === 'MONTH') return '30 Hari Terakhir';
    if (presetType === 'THIS_YEAR') return 'Tahun 2026';

    if (startDate && endDate) {
      if (startDate === endDate) return formatDateReadable(startDate);
      return `${formatDateReadable(startDate)} s/d ${formatDateReadable(endDate)}`;
    }
    return 'Pilih Waktu';
  };

  const isDaySelected = (dateStr: string) => {
    return dateStr === tempStart || dateStr === tempEnd;
  };

  const isDayInRange = (dateStr: string) => {
    if (tempStart && tempEnd) {
      return dateStr > tempStart && dateStr < tempEnd;
    }
    if (tempStart && !tempEnd && hoveredDate) {
      if (hoveredDate > tempStart) {
        return dateStr > tempStart && dateStr < hoveredDate;
      }
    }
    return false;
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full sm:w-auto">
      {/* Trigger Button - Mode Toggle UX */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold border border-border rounded-xl bg-background text-foreground hover:border-primary hover:bg-muted/40 transition-all text-left shadow-2xs cursor-pointer h-9 w-full sm:w-auto shrink-0"
        title="Klik untuk membuka pilihan rentang waktu dan kalender interaktif"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 truncate min-w-0">
          <CalendarIcon size={14} className="text-primary shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <span className="text-[9px] text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md shrink-0 font-extrabold uppercase tracking-wider">
          {isOpen ? 'Tutup' : 'Ubah ▾'}
        </span>
      </button>

      {/* Backdrop overlay on mobile screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-40 sm:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover / Mobile Sheet */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:absolute sm:inset-auto sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-[500px] max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 text-foreground animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-150 select-none">
          {/* Quick Presets List */}
          <div className="flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-border/60 pr-0 sm:pr-3 shrink-0 no-scrollbar">
            <span className="hidden sm:block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">
              Preset Cepat
            </span>
            {[
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: 'MONTH', label: '30 Hari Terakhir' },
              { id: 'WEEK', label: '7 Hari Terakhir' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'YESTERDAY', label: 'Kemarin' },
              { id: 'LAST_MONTH', label: 'Bulan Lalu' },
              { id: 'THIS_YEAR', label: 'Tahun 2026' },
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'CUSTOM', label: 'Kustom Tanggal' },
            ].map((p) => {
              const isActive =
                (p.id === 'CUSTOM' && dateFilterType === 'CUSTOM') ||
                (p.id !== 'CUSTOM' && presetType === p.id && dateFilterType !== 'CUSTOM');

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.id === 'CUSTOM') {
                      setDateFilterType('CUSTOM');
                    } else {
                      applyPreset(p.id);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Calendar Picker Panel */}
          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {/* Header: Month switcher */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 border border-border rounded-lg hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Bulan Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 border border-border rounded-lg hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Bulan Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-7" />;

                const dateStr = formatDateString(day);
                const isSelected = isDaySelected(dateStr);
                const isInRange = isDayInRange(dateStr);
                const isStart = dateStr === tempStart;
                const isEnd = dateStr === tempEnd;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setDateFilterType('CUSTOM');
                      handleDayClick(day);
                    }}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`h-7 w-full text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-black z-10 shadow-xs'
                        : isInRange
                        ? 'bg-primary/15 text-primary hover:bg-primary/25'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {day.getDate()}
                    {isStart && tempEnd && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-primary/15 -z-10 rounded-r-none" />
                    )}
                    {isEnd && tempStart && (
                      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-primary/15 -z-10 rounded-l-none" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection info & Apply action footer */}
            <div className="flex items-center justify-between border-t border-border/60 pt-2.5 mt-1">
              <div className="flex flex-col text-[10px] text-muted-foreground min-w-0">
                <span className="font-semibold uppercase tracking-wider text-[9px]">Rentang:</span>
                <span className="text-foreground font-bold truncate">
                  {tempStart ? formatDateReadable(tempStart) : '...'}
                  {tempEnd ? ` s/d ${formatDateReadable(tempEnd)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!tempStart}
                  onClick={handleApplyCustom}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <Check size={13} />
                  <span>Terapkan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
