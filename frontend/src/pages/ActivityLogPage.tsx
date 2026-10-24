import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Building2,
  Package,
  Tags,
  Users,
  Store,
  KeyRound,
  RefreshCw,
  Clock,
  Shield,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { id as localeId } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  formatDistanceToNow,
  parseISO,
} from 'date-fns';

import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useActivityLogs, useTenants } from '../hooks/useQueries.ts';
import { ActivityLogItem } from '../services/api.ts';

interface ActivityLogPageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

type DateSelectionMode = 'range' | 'single';

export const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  // Filters state
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Log for Details Diff Modal
  const [activeModalLog, setActiveModalLog] = useState<ActivityLogItem | null>(null);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // Date filter states using react-day-picker
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateMode, setDateMode] = useState<DateSelectionMode>('range');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Close calendar dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCalendarOpen]);

  // Tenan list for Admin dropdown
  const { data: tenantsData } = useTenants({ enabled: isAdmin });
  const tenants = tenantsData?.data || [];

  // Format date range ISO strings for query
  const { startIso, endIso } = useMemo(() => {
    let s: string | undefined;
    let e: string | undefined;

    if (dateMode === 'range' && selectedRange?.from) {
      s = format(startOfDay(selectedRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      if (selectedRange.to) {
        e = format(endOfDay(selectedRange.to), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      } else {
        e = format(endOfDay(selectedRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      }
    } else if (dateMode === 'single' && selectedSingleDate) {
      s = format(startOfDay(selectedSingleDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      e = format(endOfDay(selectedSingleDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }

    return { startIso: s, endIso: e };
  }, [dateMode, selectedRange, selectedSingleDate]);

  // Fetch Activity Logs via TanStack Query
  const {
    data: logsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useActivityLogs({
    tenantId: isAdmin ? selectedTenantId : undefined,
    search: searchQuery.trim() || undefined,
    startDate: startIso,
    endDate: endIso,
    page,
    limit: pageSize,
  });

  const logs = logsResponse?.data || [];
  const pagination = logsResponse?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };

  // Label for active date filter button
  const activeDateLabel = useMemo(() => {
    if (dateMode === 'range') {
      if (selectedRange?.from && selectedRange?.to) {
        return `${format(selectedRange.from, 'd MMM yyyy', { locale: localeId })} - ${format(
          selectedRange.to,
          'd MMM yyyy',
          { locale: localeId }
        )}`;
      }
      if (selectedRange?.from) {
        return `Mulai ${format(selectedRange.from, 'd MMM yyyy', { locale: localeId })}`;
      }
    } else if (dateMode === 'single' && selectedSingleDate) {
      return format(selectedSingleDate, 'd MMMM yyyy', { locale: localeId });
    }
    return 'Semua Waktu';
  }, [dateMode, selectedRange, selectedSingleDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRange(undefined);
    setSelectedSingleDate(undefined);
    if (isAdmin) setSelectedTenantId('ALL');
    setPage(1);
  };

  const handleCopyDiff = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  // Helper to render Action Badge
  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            TAMBAH
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            UBAH
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            HAPUS
          </span>
        );
      case 'REVOKE_TOKEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            REVOKE TOKEN
          </span>
        );
      case 'ACTIVATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            AKTIFKAN
          </span>
        );
      case 'DEACTIVATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            NONAKTIFKAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  // Helper to render Entity Badge
  const renderEntityBadge = (entity: string) => {
    switch (entity) {
      case 'PRODUK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Produk
          </span>
        );
      case 'KATEGORI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Tags className="w-3.5 h-3.5 text-amber-600" />
            Kategori
          </span>
        );
      case 'PENGGUNA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Pengguna
          </span>
        );
      case 'TOKO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/80">
            <Store className="w-3.5 h-3.5 text-purple-600" />
            Toko
          </span>
        );
      case 'REVOKE_TOKEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/80">
            <KeyRound className="w-3.5 h-3.5 text-rose-600" />
            Revoke Token
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
            {entity}
          </span>
        );
    }
  };

  // Helper for responsive pagination numbers
  const getPageNumbers = () => {
    const totalPages = pagination.totalPages || 1;
    const current = pagination.page || 1;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (current >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA]">
      {/* Top Header Navbar */}
      <TopNavbar currentTab="activity-log" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">




        {/* Filter Controls Bar: Single Row, Equal Height, and Fully Responsive */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
            {/* Search Input - Flex 1 */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama entitas, rincian aktivitas, aktor (user), email, atau tenan..."
                className="w-full h-10 pl-10 pr-9 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/60 transition-all flex items-center"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
              {isAdmin && (
                <TenantSelect
                  value={selectedTenantId}
                  onValueChange={(val) => {
                    setSelectedTenantId(val);
                    setPage(1);
                  }}
                  tenants={tenants}
                  allOptionLabel={`Semua Tenan (${tenants.length})`}
                  className="h-10 bg-slate-50 hover:bg-slate-100 border-slate-200 shrink-0"
                />
              )}

              {/* Date Picker Button using react-day-picker */}
              <div className="relative shrink-0" ref={calendarDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                    selectedRange?.from || selectedSingleDate
                      ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{activeDateLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isCalendarOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* react-day-picker Dropdown Card */}
                {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2.5rem)] max-w-sm sm:max-w-none sm:w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>Filter Tanggal Aktivitas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mode Toggle: Range vs Single */}
                  <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode('range');
                        setSelectedSingleDate(undefined);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                        dateMode === 'range'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rentang Tanggal (Range)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode('single');
                        setSelectedRange(undefined);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                        dateMode === 'single'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Satu Tanggal
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setDateMode('single');
                        setSelectedSingleDate(now);
                        setSelectedRange(undefined);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-medium transition-colors"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setDateMode('range');
                        setSelectedRange({ from: subDays(now, 7), to: now });
                        setSelectedSingleDate(undefined);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-medium transition-colors"
                    >
                      7 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setDateMode('range');
                        setSelectedRange({ from: subDays(now, 30), to: now });
                        setSelectedSingleDate(undefined);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-medium transition-colors"
                    >
                      30 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRange(undefined);
                        setSelectedSingleDate(undefined);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-colors ml-auto"
                    >
                      Reset
                    </button>
                  </div>

                  {/* react-day-picker Calendar */}
                  <div className="flex justify-center p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                    {dateMode === 'range' ? (
                      <DayPicker
                        mode="range"
                        selected={selectedRange}
                        onSelect={(range) => {
                          setSelectedRange(range);
                          setPage(1);
                        }}
                        locale={localeId}
                        className="scale-90 sm:scale-95 origin-top"
                      />
                    ) : (
                      <DayPicker
                        mode="single"
                        selected={selectedSingleDate}
                        onSelect={(date) => {
                          setSelectedSingleDate(date);
                          setPage(1);
                        }}
                        locale={localeId}
                        className="scale-90 sm:scale-95 origin-top"
                      />
                    )}
                  </div>

                  {/* Apply / Close button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {activeDateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Filter Button */}
            {(selectedRange?.from || selectedSingleDate || searchQuery || (isAdmin && selectedTenantId !== 'ALL')) && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Semua Filter"
                className="h-10 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Segarkan Log Button */}
            <button
              type="button"
              onClick={() => refetch()}
              title="Segarkan Log"
              className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>
      </div>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                Catatan Log Aktivitas
              </h3>
              {pagination.total > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">
                  {pagination.total} Log
                </span>
              )}
            </div>
            {pagination.totalPages > 1 && (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                Halaman {pagination.page} dari {pagination.totalPages} (10 per halaman)
              </span>
            )}
          </div>

          {/* Desktop & Tablet View: Structured Data Table (hidden on mobile < md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  {isAdmin && <th className="py-3 px-4">Tenan / Toko</th>}
                  <th className="py-3 px-4">Aktor (Pengguna)</th>
                  <th className="py-3 px-4">Entitas & Aksi</th>
                  <th className="py-3 px-4">Target Perubahan</th>
                  <th className="py-3 px-4">Rincian Aktivitas</th>
                  <th className="py-3 px-4 text-center">Perangkat / IP</th>
                  <th className="py-3 px-4 text-center">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                        <span className="font-semibold text-slate-600">
                          Memuat log aktivitas...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="py-12 text-center text-slate-400"
                    >
                      <div className="max-w-sm mx-auto flex flex-col items-center justify-center gap-2 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">
                          Tidak Ada Log Aktivitas Ditemukan
                        </p>
                        <p className="text-xs text-slate-500">
                          Belum ada catatan aktivitas yang sesuai dengan kriteria filter atau pencarian Anda.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const parsedDate = parseISO(log.createdAt);
                    const relativeTime = formatDistanceToNow(parsedDate, {
                      addSuffix: true,
                      locale: localeId,
                    });
                    const fullDateStr = format(parsedDate, 'dd/MM/yyyy HH:mm:ss');
                    const hasDiffData = !!log.previousData || !!log.newData;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Waktu */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <div className="font-mono text-slate-800 font-semibold">
                                {fullDateStr}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {relativeTime}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tenan (ADMIN view only) */}
                        {isAdmin && (
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={log.tenantName}>
                                {log.tenantName || 'Toko'}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Aktor / User */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">
                                {log.userName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-100 text-slate-600">
                                {log.userRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                              {log.userEmail}
                            </span>
                          </div>
                        </td>

                        {/* Entitas & Aksi */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {renderEntityBadge(log.entity)}
                            {renderActionBadge(log.action)}
                          </div>
                        </td>

                        {/* Target Nama */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 truncate max-w-[150px] block" title={log.entityName}>
                            {log.entityName}
                          </span>
                        </td>

                        {/* Rincian Aktivitas */}
                        <td className="py-3 px-4">
                          <p className="text-slate-600 text-xs line-clamp-2 min-w-[220px] max-w-[340px]">
                            {log.details}
                          </p>
                        </td>

                        {/* Perangkat & IP */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {log.ipAddress}
                            </span>
                            <span
                              className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5"
                              title={log.device}
                            >
                              {log.device}
                            </span>
                          </div>
                        </td>

                        {/* Data Diff Action */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {hasDiffData ? (
                            <button
                              type="button"
                              onClick={() => setActiveModalLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Diff</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Responsive Activity Cards (visible on mobile < md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                  <span className="font-semibold text-slate-600">Memuat log aktivitas...</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-700 text-sm">Tidak Ada Log Aktivitas Ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">
                  Belum ada catatan aktivitas yang sesuai dengan kriteria filter atau pencarian Anda.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              logs.map((log) => {
                const parsedDate = parseISO(log.createdAt);
                const relativeTime = formatDistanceToNow(parsedDate, {
                  addSuffix: true,
                  locale: localeId,
                });
                const fullDateStr = format(parsedDate, 'dd/MM/yyyy HH:mm:ss');
                const hasDiffData = !!log.previousData || !!log.newData;

                return (
                  <div key={log.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                    {/* Top Row: User info & Time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">{log.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-100 text-slate-600">
                              {log.userRole}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">{log.userEmail}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono font-semibold text-slate-700">{fullDateStr}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{relativeTime}</div>
                      </div>
                    </div>

                    {/* Middle Row: Entity Badge, Action Badge, Target Name, and Tenant */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {renderEntityBadge(log.entity)}
                      {renderActionBadge(log.action)}
                      {log.entityName && (
                        <span className="font-semibold text-slate-800 text-xs bg-slate-100/80 px-2 py-0.5 rounded truncate max-w-[160px]">
                          {log.entityName}
                        </span>
                      )}
                      {isAdmin && log.tenantName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{log.tenantName}</span>
                        </span>
                      )}
                    </div>

                    {/* Details text */}
                    {log.details && (
                      <p className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                        {log.details}
                      </p>
                    )}

                    {/* Bottom Row: Device/IP & Diff Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                          {log.ipAddress}
                        </span>
                        <span className="truncate text-slate-400 text-[10px]" title={log.device}>
                          {log.device}
                        </span>
                      </div>

                      {hasDiffData && (
                        <button
                          type="button"
                          onClick={() => setActiveModalLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Diff</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Responsive Pagination Controls (10 items per page) */}
          {pagination.total > 0 && (
            <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 text-center sm:text-left">
                Menampilkan{' '}
                <strong className="text-slate-800 font-bold">
                  {(pagination.page - 1) * pageSize + 1}
                </strong>
                –
                <strong className="text-slate-800 font-bold">
                  {Math.min(pagination.page * pageSize, pagination.total)}
                </strong>{' '}
                dari{' '}
                <strong className="text-slate-800 font-bold">{pagination.total}</strong> aktivitas{' '}
                <span className="text-slate-400 font-medium hidden xs:inline">(10 per halaman)</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pNum, idx) => {
                    if (pNum === '...') {
                      return (
                        <span key={`dots-${idx}`} className="w-7 sm:w-8 text-center text-slate-400 font-bold">
                          ...
                        </span>
                      );
                    }
                    const num = Number(pNum);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPage(num)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          pagination.page === num
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Diff & Detail Modal */}
      {activeModalLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Rincian Perubahan Data
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModalLog.entity} &bull; {activeModalLog.action} &bull;{' '}
                    {activeModalLog.entityName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalLog(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Waktu</span>
                  <span className="font-semibold text-slate-800">
                    {format(parseISO(activeModalLog.createdAt), 'dd MMM yyyy HH:mm:ss')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Aktor</span>
                  <span className="font-semibold text-slate-800">{activeModalLog.userName}</span>
                  <span className="text-[10px] text-slate-500 block">({activeModalLog.userRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Toko/Tenan</span>
                  <span className="font-semibold text-slate-800">{activeModalLog.tenantName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Alamat IP</span>
                  <span className="font-mono text-slate-800">{activeModalLog.ipAddress}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                <span className="font-bold block text-[11px] text-amber-800 mb-0.5">Deskripsi Perubahan:</span>
                {activeModalLog.details}
              </div>

              {/* Diff Columns: Previous vs New Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Data */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-700">
                    <span>Data Sebelumnya (Previous)</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      BEFORE
                    </span>
                  </div>
                  <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-xl border border-slate-800 overflow-x-auto max-h-56">
                    {activeModalLog.previousData ? (
                      <pre>{JSON.stringify(activeModalLog.previousData, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-500 italic">(Tidak ada data sebelumnya)</span>
                    )}
                  </div>
                </div>

                {/* New Data */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Data Baru (New Data)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      AFTER
                    </span>
                  </div>
                  <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 overflow-x-auto max-h-56">
                    {activeModalLog.newData ? (
                      <pre>{JSON.stringify(activeModalLog.newData, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-500 italic">(Data dihapus atau tidak tersedia)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() =>
                  handleCopyDiff(
                    JSON.stringify(
                      {
                        event: activeModalLog.details,
                        entity: activeModalLog.entity,
                        action: activeModalLog.action,
                        previous: activeModalLog.previousData,
                        new: activeModalLog.newData,
                      },
                      null,
                      2
                    )
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                {copiedDiff ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin ke Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Data JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModalLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
