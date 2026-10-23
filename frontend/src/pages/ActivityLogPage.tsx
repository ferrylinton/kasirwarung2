import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  CalendarRange,
  ChevronDown,
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
  Filter,
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

const ENTITY_OPTIONS = [
  { value: 'ALL', label: 'Semua Entitas', icon: Filter },
  { value: 'PRODUK', label: 'Produk', icon: Package },
  { value: 'KATEGORI', label: 'Kategori', icon: Tags },
  { value: 'PENGGUNA', label: 'Pengguna', icon: Users },
  { value: 'TOKO', label: 'Toko', icon: Store },
  { value: 'REVOKE_TOKEN', label: 'Revoke Token', icon: KeyRound },
];

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Semua Aksi' },
  { value: 'CREATE', label: 'Tambah (CREATE)' },
  { value: 'UPDATE', label: 'Ubah (UPDATE)' },
  { value: 'DELETE', label: 'Hapus (DELETE)' },
  { value: 'REVOKE_TOKEN', label: 'Cabut Sesi (REVOKE)' },
  { value: 'ACTIVATE', label: 'Aktifkan Toko' },
  { value: 'DEACTIVATE', label: 'Nonaktifkan Toko' },
];

export const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  // Filters state
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

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
    entity: selectedEntity !== 'ALL' ? selectedEntity : undefined,
    action: selectedAction !== 'ALL' ? selectedAction : undefined,
    search: searchQuery.trim() || undefined,
    startDate: startIso,
    endDate: endIso,
    page,
    limit: pageSize,
  });

  const logs = logsResponse?.data || [];
  const pagination = logsResponse?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const stats = logsResponse?.stats || {
    totalAll: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalStore: 0,
    totalRevokes: 0,
  };

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
    setSelectedEntity('ALL');
    setSelectedAction('ALL');
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA]">
      {/* Top Header Navbar */}
      <TopNavbar currentTab="activity-log" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Title & Scope Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Log Aktivitas & Audit Trail
                  {isFetching && (
                    <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  )}
                </h1>
                <p className="text-xs text-slate-500">
                  {isAdmin
                    ? 'Memantau seluruh perubahan data Produk, Kategori, Pengguna, Toko, dan Sesi Token di semua tenan platform.'
                    : `Memantau riwayat audit perubahan data di toko ${user?.tenantName || 'Anda'}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Tenan Radix Select for Admin, or Current Store Badge for Shop Owner */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  Filter Tenan:
                </span>
                <TenantSelect
                  value={selectedTenantId}
                  onValueChange={(val) => {
                    setSelectedTenantId(val);
                    setPage(1);
                  }}
                  tenants={tenants}
                  allOptionLabel={`Semua Tenan (${tenants.length})`}
                  className="bg-slate-50 hover:bg-slate-100 border-slate-200"
                />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-semibold">
                <Store className="w-3.5 h-3.5 text-orange-600" />
                <span>{user?.tenantName || 'Toko Anda'}</span>
                <span className="text-[10px] bg-orange-200/70 text-orange-900 px-1.5 py-0.5 rounded font-mono">
                  SHOP_OWNER
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              title="Segarkan Log"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => {
              setSelectedEntity('ALL');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'ALL'
                ? 'bg-orange-50/50 border-orange-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Log
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {stats.totalAll.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Semua aktivitas</span>
          </div>

          <div
            onClick={() => {
              setSelectedEntity('PRODUK');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'PRODUK'
                ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Produk
              </span>
              <Package className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1 tabular-nums">
              {stats.totalProducts.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-emerald-600/70 mt-0.5 block">Mutasi katalog</span>
          </div>

          <div
            onClick={() => {
              setSelectedEntity('KATEGORI');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'KATEGORI'
                ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Kategori
              </span>
              <Tags className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-800 mt-1 tabular-nums">
              {stats.totalCategories.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-amber-600/70 mt-0.5 block">Klasifikasi produk</span>
          </div>

          <div
            onClick={() => {
              setSelectedEntity('PENGGUNA');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'PENGGUNA'
                ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Pengguna
              </span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-blue-800 mt-1 tabular-nums">
              {stats.totalUsers.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-blue-600/70 mt-0.5 block">Akun kasir & staf</span>
          </div>

          <div
            onClick={() => {
              setSelectedEntity('TOKO');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'TOKO'
                ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Toko
              </span>
              <Store className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-800 mt-1 tabular-nums">
              {stats.totalStore.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-purple-600/70 mt-0.5 block">Status & PPN</span>
          </div>

          <div
            onClick={() => {
              setSelectedEntity('REVOKE_TOKEN');
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedEntity === 'REVOKE_TOKEN'
                ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                Revoke Token
              </span>
              <KeyRound className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-800 mt-1 tabular-nums">
              {stats.totalRevokes.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-rose-600/70 mt-0.5 block">Pencabutan sesi</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama entitas, rincian aktivitas, aktor (user), email, atau tenan..."
                className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/60 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Entity Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {ENTITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = selectedEntity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedEntity(opt.value);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Action Select Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Aksi:</span>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                {ACTION_OPTIONS.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker Button using react-day-picker */}
            <div className="relative" ref={calendarDropdownRef}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                    selectedRange?.from || selectedSingleDate
                      ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 text-orange-600" />
                  <span>{activeDateLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isCalendarOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {(selectedRange?.from || selectedSingleDate || selectedEntity !== 'ALL' || selectedAction !== 'ALL' || searchQuery || (isAdmin && selectedTenantId !== 'ALL')) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    title="Reset Semua Filter"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>

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
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Menampilkan halaman{' '}
                <strong className="text-slate-800">{pagination.page}</strong> dari{' '}
                <strong className="text-slate-800">{pagination.totalPages}</strong> (Total{' '}
                <strong className="text-slate-800">{pagination.total}</strong> aktivitas)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pNum = i + 1;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setPage(pNum)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                          pagination.page === pNum
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Selanjutnya
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
