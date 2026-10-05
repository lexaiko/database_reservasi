'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Reservasi, DashboardKpi } from '@/lib/types';
import { formatDateDisplay } from '@/lib/formatters';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { HeaderBar } from '@/components/HeaderBar';
import KpiMetrics from '@/components/KpiMetrics';
import SalesCharts from '@/components/SalesCharts';
import FilterBar from '@/components/FilterBar';
import ReservationTable from '@/components/ReservationTable';
import { OperasionalView } from '@/components/OperasionalView';
import { HppView } from '@/components/HppView';
import HppManagerView from '@/components/HppManagerView';
import ModalNewReservation from '@/components/ModalNewReservation';
import ModalDetail from '@/components/ModalDetail';
import ModalEdit from '@/components/ModalEdit';
import ModalEditCrewHotel from '@/components/ModalEditCrewHotel';
import ModalHppManager from '@/components/ModalHppManager';
import ModalReviewLink from '@/components/ModalReviewLink';
import ModalChangePassword from '@/components/ModalChangePassword';
import { AuthGuard } from '@/components/AuthGuard';
import AdminSettingsView from '@/components/AdminSettingsView';
import { SourceReviewView } from '@/components/SourceReviewView';
import { DashboardDateFilter } from '@/components/DashboardDateFilter';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

const DEFAULT_KPI: DashboardKpi = {
  totalPenjualan: 0,
  totalPax: 0,
  totalRevenue: 0,
  totalHpp: 0,
  grossProfit: 0,
  grossMargin: 0,
  totalBelumLunas: 0,
  countBelumLunas: 0,
};

const NAMA_BULAN_MAP: Record<string, string> = {
  '1': 'Januari',
  '2': 'Februari',
  '3': 'Maret',
  '4': 'April',
  '5': 'Mei',
  '6': 'Juni',
  '7': 'Juli',
  '8': 'Agustus',
  '9': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const isSuperadmin = profile?.role === 'superadmin';
  const isIntern = profile?.role === 'intern';
  const isAdmin = profile?.role === 'admin';
  const isNonPicAdmin = isAdmin && profile?.isPic === false;
  const userAllowedPics = useMemo(() => {
    return isNonPicAdmin && Array.isArray(profile?.allowedPics) ? profile.allowedPics : [];
  }, [isNonPicAdmin, profile?.allowedPics]);

  // Fail-safe: jika assignedPic di Firestore kosong untuk role admin PIC, otomatis fallback ke nama profil
  const userAssignedPic = (
    isNonPicAdmin
      ? ''
      : profile?.assignedPic || (profile?.role === 'admin' ? profile?.name : '') || ''
  ).trim();
  const isPicLocked = !isSuperadmin && !isNonPicAdmin && Boolean(userAssignedPic);

  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Guard tab settings: jika bukan superadmin, arahkan ke dashboard
  useEffect(() => {
    if (activeTab === 'settings' && profile && !isSuperadmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, profile, isSuperadmin]);

  const handleSelectTab = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripbwi_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    }
  }, []);

  // Restore activeTab from URL hash or localStorage on initial client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const VALID_TABS: NavTab[] = ['dashboard', 'reservasi', 'leads-review', 'hpp', 'operasional', 'settings'];
    const hash = window.location.hash.replace('#', '') as NavTab;
    if (VALID_TABS.includes(hash)) {
      setActiveTab(hash);
      return;
    }

    const savedTab = localStorage.getItem('tripbwi_active_tab') as NavTab | null;
    if (savedTab && VALID_TABS.includes(savedTab)) {
      setActiveTab(savedTab);
      window.history.replaceState(null, '', `#${savedTab}`);
    }
  }, []);

  // Listen for browser back / forward hash navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const VALID_TABS: NavTab[] = ['dashboard', 'reservasi', 'leads-review', 'hpp', 'operasional', 'settings'];
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        localStorage.setItem('tripbwi_active_tab', hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Data States
  const [reservations, setReservations] = useState<Reservasi[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [kpi, setKpi] = useState<DashboardKpi>(DEFAULT_KPI);
  const [trenPenjualan, setTrenPenjualan] = useState<any[]>([]);
  const [topPaket, setTopPaket] = useState<any[]>([]);
  const [topPic, setTopPic] = useState<any[]>([]);
  const [topSumber, setTopSumber] = useState<any[]>([]);

  // PIC List: diambil dari nama akun admin yang berstatus PIC (isPic !== false) + PIC sheet riil.
  // Admin non-PIC dan Intern bukan penanggung jawab PIC tunggal sehingga tidak masuk ke picList sistem.
  const [picList, setPicList] = useState<string[]>([]);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, 'users'))
      .then((snap) => {
        const names: string[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.role === 'admin' && data.status !== 'inactive') {
            // Hanya akun admin berstatus PIC (isPic !== false) yang masuk list PIC sistem
            if (data.isPic !== false) {
              const n = (data.assignedPic || data.name || '').trim();
              if (n) names.push(n);
            }
          }
        });
        const sorted = Array.from(new Set<string>(names)).sort();
        setPicList(sorted);
      })
      .catch((err) => {
        console.error('Failed to load picList:', err);
        setPicList([]);
      });
  }, []);

  // Opsi PIC yang tersedia bagi akun login saat ini:
  // Jika admin non-PIC, pilihan sekat dibatasi hanya pada daftar allowedPics miliknya.
  const availablePicOptions = useMemo(() => {
    if (isNonPicAdmin && userAllowedPics.length > 0) {
      return userAllowedPics;
    }
    return picList;
  }, [isNonPicAdmin, userAllowedPics, picList]);

  // Sekat efektif yang di-scope untuk tab detail (HPP, Operasional, Source & Review):
  const effectiveScopedPic = useMemo(() => {
    if (isPicLocked && userAssignedPic) return userAssignedPic;
    if (isNonPicAdmin && userAllowedPics.length > 0) return userAllowedPics.join(',');
    return '';
  }, [isPicLocked, userAssignedPic, isNonPicAdmin, userAllowedPics]);

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [statusTrip, setStatusTrip] = useState('all');
  const [statusPayment, setStatusPayment] = useState('all');
  const [finishMonth, setFinishMonth] = useState('all');
  const [finishYear, setFinishYear] = useState('2026');
  const [pic, setPic] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Dedicated Dashboard Date Range & Month States
  const [dashboardMonth, setDashboardMonth] = useState('all');
  const [dashboardYear, setDashboardYear] = useState('2026');
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');
  const [dashboardPic, setDashboardPic] = useState('all');

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Modal & Selection States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCrewHotelModalOpen, setIsCrewHotelModalOpen] = useState(false);
  const [isHppModalOpen, setIsHppModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState<Reservasi | null>(null);
  const [selectedHppKode, setSelectedHppKode] = useState<string>('');
  const [hppInitialMode, setHppInitialMode] = useState<'update' | 'detail' | 'katalog'>('katalog');

  // Initialize theme from system or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('tripbwi_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tripbwi_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Auto-hide toast after 5s
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Fetch Dashboard Analytics (KPI, Charts)
  const fetchDashboardData = useCallback(async () => {
    try {
      const targetPic = dashboardPic !== 'all' ? dashboardPic : pic;
      let effectivePic = isPicLocked && userAssignedPic ? userAssignedPic : targetPic;

      // Jika admin non-PIC dengan batasan allowedPics memilih 'all', querykan gabungan allowedPics
      if (isNonPicAdmin && userAllowedPics.length > 0 && effectivePic === 'all') {
        effectivePic = userAllowedPics.join(',');
      }

      const q = new URLSearchParams({
        month: dashboardStartDate || dashboardEndDate ? 'all' : dashboardMonth,
        year: dashboardYear,
        pic: effectivePic,
      });

      if (dashboardStartDate) q.set('startDate', dashboardStartDate);
      if (dashboardEndDate) q.set('endDate', dashboardEndDate);

      const res = await fetch(`/api/dashboard?${q.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setKpi(data.data.kpi);
        setTrenPenjualan(data.data.trenPenjualan || []);
        setTopPaket(data.data.topPaket || []);
        setTopPic(data.data.topPic || []);
        setTopSumber(data.data.topSumber || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard KPI:', err);
    }
  }, [
    dashboardMonth,
    dashboardYear,
    pic,
    dashboardStartDate,
    dashboardEndDate,
    dashboardPic,
    isPicLocked,
    userAssignedPic,
    isNonPicAdmin,
    userAllowedPics,
  ]);

  // Fetch Reservations Table (Load all data so all tabs have full dataset without 50-limit flash)
  const fetchReservations = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      try {
        let effectivePic = isPicLocked && userAssignedPic ? userAssignedPic : pic;
        if (isNonPicAdmin && userAllowedPics.length > 0 && effectivePic === 'all') {
          effectivePic = userAllowedPics.join(',');
        }

        const q = new URLSearchParams({
          search,
          statusTrip,
          statusPayment,
          finishMonth,
          finishYear,
          pic: effectivePic,
          all: 'true',
        });

        if (forceRefresh) {
          q.set('refresh', 'true');
        }

        const res = await fetch(`/api/reservasi?${q.toString()}`);
        const data = await res.json();
        if (data.success) {
          const list = data.data || [];
          setReservations(list);
          setTotalReservations(data.total || list.length);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      search,
      statusTrip,
      statusPayment,
      finishMonth,
      finishYear,
      pic,
      isPicLocked,
      userAssignedPic,
      isNonPicAdmin,
      userAllowedPics,
    ]
  );

  // Client-side pagination for Tab 2 Reservation Table
  const paginatedReservations = React.useMemo(() => {
    const startIndex = (page - 1) * limit;
    return reservations.slice(startIndex, startIndex + limit);
  }, [reservations, page, limit]);

  // Initial and reactive load - dipanggil setelah profil otentikasi siap
  useEffect(() => {
    if (!profile) return;
    fetchReservations();
    fetchDashboardData();
  }, [profile, fetchReservations, fetchDashboardData]);

  // Kunci PIC jika akun adalah Admin PIC atau Intern (Asisten PIC)
  useEffect(() => {
    if (isPicLocked && userAssignedPic) {
      setPic(userAssignedPic);
      setDashboardPic(userAssignedPic);
    }
  }, [isPicLocked, userAssignedPic]);

  // Sync Trip Statuses (Hari H: On Going, Finish: Finish on Review)
  const handleSyncStatuses = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/reservasi/sync-status', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: 'success',
          text: data.message,
        });
        fetchReservations(true);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Gagal menyelaraskan status trip.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Hapus Reservasi (Superadmin & Admin PIC, DILARANG UNTUK INTERN)
  const handleDeleteReservation = async (r: Reservasi) => {
    if (isIntern) {
      setToastMessage({
        type: 'error',
        text: 'Akses ditolak: Anak magang tidak memiliki izin untuk menghapus data reservasi.',
      });
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin menghapus reservasi ${r.namaTamu} (${r.kode}) secara permanen dari Google Sheets?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/reservasi/${encodeURIComponent(r.kode)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': profile?.role || 'admin',
        },
      });
      const json = await res.json();
      if (json.success) {
        setToastMessage({
          type: 'success',
          text: `Reservasi ${r.kode} berhasil dihapus dari sistem!`,
        });
        fetchReservations(true);
        fetchDashboardData();
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
          setActiveReservation(null);
        }
      } else {
        setToastMessage({
          type: 'error',
          text: json.error || 'Gagal menghapus reservasi.',
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan jaringan.',
      });
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusTrip('all');
    setStatusPayment('all');
    setFinishMonth('all');
    setFinishYear('2026');
    setPic(isPicLocked ? userAssignedPic : 'all');
    setPage(1);
  };

  const selectedMonthName = finishMonth !== 'all' ? NAMA_BULAN_MAP[finishMonth] : undefined;
  const countNeedsHpp = reservations.filter((r) => r.needsHppUpdate).length;
  const unpaidReservationsCount = reservations.filter(
    (r) => r.statusPayment !== 'Lunas' && r.statusPayment !== 'Cancel' && r.sisaPelunasan > 0
  ).length;

  return (
    <AuthGuard>
      <div className="flex h-screen h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'hpp') {
              setHppInitialMode('katalog');
              setSelectedHppKode('');
            }
            handleSelectTab(tab);
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          unpaidCount={unpaidReservationsCount}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'hpp') {
              setHppInitialMode('katalog');
              setSelectedHppKode('');
            }
            handleSelectTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isCollapsed={false}
          onToggleCollapse={() => setIsMobileSidebarOpen(false)}
          unpaidCount={unpaidReservationsCount}
          onOpenChangePassword={() => {
            setIsMobileSidebarOpen(false);
            setIsChangePasswordOpen(true);
          }}
        />
      </div>

      {/* Main Independent Scroll Container */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        {/* Top Header Bar */}
        <HeaderBar
          activeTab={activeTab}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          onSyncStatuses={handleSyncStatuses}
          isSyncing={isSyncing}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />

        {/* Content Body */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Toast Notification Alert */}
          {toastMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between shadow-md transition-all animate-fade-in ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : toastMessage.type === 'warning'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Global Warning Banner: Notifikasi Update HPP jika terjadi overpayment */}
          {countNeedsHpp > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-xs flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-extrabold text-xs sm:text-sm block">
                    Perhatian: Ditemukan {countNeedsHpp} reservasi dengan penyesuaian nominal order!
                  </span>
                  <span className="text-xs text-amber-700/80 dark:text-amber-400 font-medium">
                    Sesuai aturan sistem, silakan periksa rincian biaya dan lakukan update HPP pada baris yang bertanda kuning.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD EKSEKUTIF */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Filter Rentang Waktu Dashboard - Single Unified Time Filter */}
              <DashboardDateFilter
                startDate={dashboardStartDate}
                endDate={dashboardEndDate}
                pic={isPicLocked ? userAssignedPic : dashboardPic}
                onDateChange={(start, end) => {
                  setDashboardStartDate(start);
                  setDashboardEndDate(end);
                  setDashboardMonth('all');
                }}
                onPicChange={(p) => setDashboardPic(p)}
                onReset={() => {
                  setDashboardStartDate('');
                  setDashboardEndDate('');
                  setDashboardMonth('all');
                  setDashboardYear('2026');
                  setDashboardPic(isPicLocked ? userAssignedPic : 'all');
                }}
                picList={availablePicOptions}
                isPicLocked={isPicLocked}
                isNonPicAdmin={isNonPicAdmin}
                allowedPics={userAllowedPics}
                totalSalesCount={kpi.totalPenjualan}
              />

              <KpiMetrics
                kpi={kpi}
                selectedMonthName={
                  dashboardStartDate && dashboardEndDate
                    ? `${formatDateDisplay(dashboardStartDate)} s/d ${formatDateDisplay(dashboardEndDate)}`
                    : dashboardMonth !== 'all'
                    ? NAMA_BULAN_MAP[dashboardMonth]
                    : undefined
                }
                selectedYear={dashboardYear}
                isIntern={isIntern}
              />

              <SalesCharts
                trenPenjualan={trenPenjualan}
                topPaket={topPaket}
                topPic={topPic}
                topSumber={topSumber}
              />

              {/* Quick Filter & Table Preview */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={() => handleSelectTab('reservasi')}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buka Tabel Lengkap →
                  </button>
                </div>

                <ReservationTable
                  reservations={reservations.slice(0, 15)}
                  total={totalReservations}
                  page={page}
                  limit={15}
                  onPageChange={setPage}
                  onViewDetail={(r) => {
                    setActiveReservation(r);
                    setIsDetailModalOpen(true);
                  }}
                  onEdit={(r) => {
                    setActiveReservation(r);
                    setIsEditModalOpen(true);
                  }}
                  onOpenHpp={(r) => {
                    setActiveReservation(r);
                    setSelectedHppKode(r.kode);
                    setHppInitialMode('update');
                    handleSelectTab('hpp');
                  }}
                  onOpenReview={(r) => {
                    setActiveReservation(r);
                    setIsReviewModalOpen(true);
                  }}
                  onDelete={!isIntern ? handleDeleteReservation : undefined}
                  isIntern={isIntern}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE RESERVASI LENGKAP */}
          {activeTab === 'reservasi' && (
            <div className="space-y-5 animate-fade-in">
              <FilterBar
                search={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                statusTrip={statusTrip}
                onStatusTripChange={(val) => {
                  setStatusTrip(val);
                  setPage(1);
                }}
                statusPayment={statusPayment}
                onStatusPaymentChange={(val) => {
                  setStatusPayment(val);
                  setPage(1);
                }}
                finishMonth={finishMonth}
                onFinishMonthChange={(val) => {
                  setFinishMonth(val);
                  setPage(1);
                }}
                pic={pic}
                onPicChange={(val) => {
                  setPic(val);
                  setPage(1);
                }}
                onResetFilters={handleResetFilters}
                onRefreshData={() => {
                  fetchReservations(true);
                  fetchDashboardData();
                }}
                isPicLocked={isPicLocked}
                isNonPicAdmin={isNonPicAdmin}
                allowedPics={userAllowedPics}
                picList={availablePicOptions}
                isLoading={isLoading}
              />

              <ReservationTable
                reservations={paginatedReservations}
                total={totalReservations}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onViewDetail={(r) => {
                  setActiveReservation(r);
                  setIsDetailModalOpen(true);
                }}
                onEdit={(r) => {
                  setActiveReservation(r);
                  setIsEditModalOpen(true);
                }}
                onOpenHpp={(r) => {
                  setActiveReservation(r);
                  setSelectedHppKode(r.kode);
                  setHppInitialMode('update');
                  handleSelectTab('hpp');
                }}
                onOpenReview={(r) => {
                  setActiveReservation(r);
                  setIsReviewModalOpen(true);
                }}
                onDelete={!isIntern ? handleDeleteReservation : undefined}
                isIntern={isIntern}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* TAB 3: HPP & STATUS TAMU */}
          {activeTab === 'hpp' && (
            <HppManagerView
              reservations={reservations}
              initialKode={selectedHppKode}
              initialMode={hppInitialMode}
              assignedPic={effectiveScopedPic}
              isIntern={isIntern}
              onRefreshData={() => {
                fetchReservations(true);
                fetchDashboardData();
              }}
              onSuccess={(msg) => setToastMessage({ type: 'success', text: msg })}
            />
          )}

          {/* TAB 4: JADWAL & OPERASIONAL HARI H */}
          {activeTab === 'operasional' && (
            <OperasionalView
              reservations={reservations}
              assignedPic={effectiveScopedPic}
              onOpenReview={(r) => {
                setActiveReservation(r);
                setIsReviewModalOpen(true);
              }}
              onViewDetail={(r) => {
                setActiveReservation(r);
                setIsDetailModalOpen(true);
              }}
              onEdit={(r) => {
                setActiveReservation(r);
                setIsEditModalOpen(true);
              }}
              onEditCrewHotel={(r) => {
                setActiveReservation(r);
                setIsCrewHotelModalOpen(true);
              }}
            />
          )}

          {/* TAB: INPUT SOURCE, REVIEW & FOTO DOKUMENTASI */}
          {activeTab === 'leads-review' && (
            <SourceReviewView
              reservations={reservations}
              assignedPic={effectiveScopedPic}
              onReservationUpdated={(updated) => {
                setReservations((prev) =>
                  prev.map((r) => (r.kode === updated.kode ? { ...r, ...updated } : r))
                );
                setToastMessage({
                  type: 'success',
                  text: `Data ${updated.kode} (${updated.namaTamu}) berhasil disimpan!`,
                });
              }}
              onRefresh={() => fetchReservations(true)}
            />
          )}

          {/* TAB 5: PENGATURAN SUPERADMIN (CRUD ADMIN & SETTING SHEET) */}
          {activeTab === 'settings' && isSuperadmin && (
            <AdminSettingsView
              currentUserEmail={profile?.email}
              onSuccessToast={(msg) => setToastMessage({ type: 'success', text: msg })}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-border bg-card py-4 px-6 text-center text-xs text-muted-foreground font-medium shrink-0">
          <p>
            © 2026 <strong>TripBanyuwangi</strong> • Executive Space &amp; Database Reservasi
          </p>
        </footer>
      </main>

      {/* MODALS */}
      <ModalNewReservation
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        defaultPic={userAssignedPic || availablePicOptions[0] || ''}
        isPicLocked={isPicLocked}
        picList={availablePicOptions}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          fetchReservations(true);
          fetchDashboardData();
        }}
      />

      <ModalDetail
        reservasi={activeReservation}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveReservation(null);
        }}
        onOpenHpp={(r) => {
          setActiveReservation(r);
          setSelectedHppKode(r.kode);
          setHppInitialMode('update');
          setIsDetailModalOpen(false);
          handleSelectTab('hpp');
        }}
        onOpenDetailHpp={(r) => {
          setActiveReservation(r);
          setSelectedHppKode(r.kode);
          setHppInitialMode('detail');
          setIsDetailModalOpen(false);
          handleSelectTab('hpp');
        }}
        onOpenEdit={(r) => {
          setActiveReservation(r);
          setIsEditModalOpen(true);
        }}
        onDelete={!isIntern ? handleDeleteReservation : undefined}
        isIntern={isIntern}
      />

      <ModalEdit
        reservasi={activeReservation}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveReservation(null);
        }}
        isPicLocked={isPicLocked}
        picList={availablePicOptions}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          fetchReservations(true);
          fetchDashboardData();
        }}
      />

      <ModalEditCrewHotel
        reservasi={activeReservation}
        isOpen={isCrewHotelModalOpen}
        onClose={() => {
          setIsCrewHotelModalOpen(false);
          setActiveReservation(null);
        }}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          fetchReservations(true);
          fetchDashboardData();
        }}
      />

      <ModalHppManager
        reservasi={activeReservation}
        isOpen={isHppModalOpen}
        onClose={() => {
          setIsHppModalOpen(false);
          setActiveReservation(null);
        }}
        isIntern={isIntern}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          fetchReservations(true);
          fetchDashboardData();
        }}
      />

      <ModalReviewLink
        reservasi={activeReservation}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setActiveReservation(null);
        }}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg });
          fetchReservations(true);
          fetchDashboardData();
        }}
      />

      <ModalChangePassword
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccessToast={(msg) => setToastMessage({ type: 'success', text: msg })}
      />

      {/* Mobile Bottom Navigation Bar (1-Thumb UX) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'hpp') {
            setHppInitialMode('katalog');
            setSelectedHppKode('');
          }
          handleSelectTab(tab);
        }}
        unpaidCount={unpaidReservationsCount}
      />
    </div>
    </AuthGuard>
  );
}
