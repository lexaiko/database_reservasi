'use client';

import React from 'react';
import { Plus, RefreshCw, Calendar, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenNewModal: () => void;
  onSyncStatuses: () => void;
  isSyncing: boolean;
  totalReservations: number;
}

export default function Navbar({
  onOpenNewModal,
  onSyncStatuses,
  isSyncing,
  totalReservations,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-extrabold text-xl">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Trip<span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Banyuwangi</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm">
                Executive CRM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Database Reservasi & Sistem Rekonsiliasi Penjualan 2026
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onSyncStatuses}
            disabled={isSyncing}
            title="Sinkronisasi otomatis Status Trip (On Going, Finish on Review) ke Google Sheets"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all disabled:opacity-60 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-600' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{isSyncing ? 'Menyelaraskan...' : 'Auto-Sync Status'}</span>
            <span className="md:hidden">Sync</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Reservasi Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
}
