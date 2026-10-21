import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Calendar,
  CalendarRange,
  ChevronDown,
  Search,
  X,
  Building2,
  Users,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertCircle,
  Filter,
  Globe,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { id as localeId } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import {
  format,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isSameDay,
} from 'date-fns';

import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLoginHistory, useTenants } from '../hooks/useQueries.ts';
import { LoginHistoryItem } from '../services/api.ts';

interface LoginHistoryPageProps {
  onBackToPos: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

type DateSelectionMode = 'range' | 'single';

export const LoginHistoryPage: React.FC<LoginHistoryPageProps> = ({
  onBackToPos,
  onNavigate,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isManager =
    user?.role === 'MANAGER' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik';

  // Admin tenant filter state
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Date filter states using react-day-picker in dropdown
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateMode, setDateMode] = useState<DateSelectionMode>('range');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Close calendar dropdown when clicking outside or pressing Escape
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

  // Tenan list for Admin
  const { data: tenantsData } = useTenants({ enabled: isAdmin });
  const tenants = tenantsData?.data || [];

  // Format date range ISO strings for API query
  const formattedStartDate = useMemo(() => {
    if (dateMode === 'range' && selectedRange?.from) {
      return startOfDay(selectedRange.from).toISOString();
    }
    if (dateMode === 'single' && selectedSingleDate) {
      return startOfDay(selectedSingleDate).toISOString();
    }
    return undefined;
  }, [dateMode, selectedRange, selectedSingleDate]);

  const formattedEndDate = useMemo(() => {
    if (dateMode === 'range' && selectedRange?.to) {
      return endOfDay(selectedRange.to).toISOString();
    }
    if (dateMode === 'range' && selectedRange?.from && !selectedRange.to) {
      return endOfDay(selectedRange.from).toISOString();
    }
    if (dateMode === 'single' && selectedSingleDate) {
      return endOfDay(selectedSingleDate).toISOString();
    }
    return undefined;
  }, [dateMode, selectedRange, selectedSingleDate]);

  // Query login history from backend
  const {
    data: historyData,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useLoginHistory({
    tenantId: isAdmin ? selectedTenantId : undefined,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    search: searchQuery,
  });

  const rawLogs: LoginHistoryItem[] = historyData?.data || [];

  // Filter logs locally as well for immediate interactive feedback
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      // Tenant filter for Admin
      if (isAdmin && selectedTenantId !== 'ALL') {
        if (log.tenantId && log.tenantId !== selectedTenantId) {
          return false;
        }
      }

      // Client-side date boundary check
      if (log.createdAt) {
        const logDate = new Date(log.createdAt);
        if (dateMode === 'range' && selectedRange?.from) {
          const from = startOfDay(selectedRange.from);
          const to = selectedRange.to
            ? endOfDay(selectedRange.to)
            : endOfDay(selectedRange.from);
          if (!isWithinInterval(logDate, { start: from, end: to })) {
            return false;
          }
        } else if (dateMode === 'single' && selectedSingleDate) {
          if (!isSameDay(logDate, selectedSingleDate)) {
            return false;
          }
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = log.name?.toLowerCase().includes(q);
        const matchesEmail = log.email?.toLowerCase().includes(q);
        const matchesUsername = log.username?.toLowerCase().includes(q);
        const matchesDevice = log.device?.toLowerCase().includes(q);
        const matchesIp = log.ipAddress?.toLowerCase().includes(q);
        const matchesTenant = log.tenantName?.toLowerCase().includes(q);
        const matchesRole = log.role?.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesUsername &&
          !matchesDevice &&
          !matchesIp &&
          !matchesTenant &&
          !matchesRole
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    rawLogs,
    selectedTenantId,
    isAdmin,
    dateMode,
    selectedRange,
    selectedSingleDate,
    searchQuery,
  ]);

  // Date picker retention boundaries (max 3 months)
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);

  // Helper to reset date filter
  const handleResetDateFilter = () => {
    setSelectedRange(undefined);
    setSelectedSingleDate(undefined);
    setIsCalendarOpen(false);
  };

  // Label for the date trigger button
  const activeDateLabel = useMemo(() => {
    if (dateMode === 'range') {
      if (selectedRange?.from && selectedRange?.to) {
        if (isSameDay(selectedRange.from, selectedRange.to)) {
          return format(selectedRange.from, 'd MMM yyyy', { locale: localeId });
        }
        return `${format(selectedRange.from, 'd MMM', {
          locale: localeId,
        })} - ${format(selectedRange.to, 'd MMM yyyy', { locale: localeId })}`;
      }
      if (selectedRange?.from) {
        return `Mulai ${format(selectedRange.from, 'd MMM yyyy', {
          locale: localeId,
        })}`;
      }
      return 'Semua Tanggal';
    } else {
      if (selectedSingleDate) {
        if (isSameDay(selectedSingleDate, today)) {
          return 'Hari Ini';
        }
        return format(selectedSingleDate, 'd MMM yyyy', { locale: localeId });
      }
      return 'Semua Tanggal';
    }
  }, [dateMode, selectedRange, selectedSingleDate, today]);


  // Device icon helper
  const getDeviceIcon = (deviceStr: string) => {
    const d = deviceStr.toLowerCase();
    if (d.includes('mobile') || d.includes('android') || d.includes('phone') || d.includes('redmi') || d.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-emerald-600" />;
    }
    if (d.includes('ipad') || d.includes('tablet')) {
      return <Tablet className="w-4 h-4 text-sky-600" />;
    }
    return <Laptop className="w-4 h-4 text-indigo-600" />;
  };

  // Role badge helper
  const renderRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200/80">
          <KeyRound className="w-3 h-3" />
          <span>ADMIN</span>
        </span>
      );
    }
    if (r === 'SHOP_OWNER' || r === 'PEMILIK' || r === 'MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200/80">
          <Users className="w-3 h-3" />
          <span>MANAGER</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/80">
        <span>KASIR</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      {/* Top Navigation */}
      <TopNavbar currentTab="login-history" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full space-y-6">

          {/* Filter Bar with TenantSelect & react-day-picker Dropdown */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Left group: Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari user, email, username, perangkat, atau IP..."
                  className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right group: Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. TenantSelect (Khusus Role ADMIN) */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <TenantSelect
                      value={selectedTenantId}
                      onValueChange={setSelectedTenantId}
                      tenants={tenants}
                      includeAllOption={true}
                      allOptionLabel={`Semua Tenan (${tenants.length})`}
                      placeholder="Pilih Tenan"
                      className="text-xs md:text-sm"
                    />
                  </div>
                )}

                {/* 3. react-day-picker Dropdown Filter */}
                <div className="relative" ref={calendarDropdownRef}>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                        selectedRange?.from || selectedSingleDate
                          ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <CalendarRange className="w-4 h-4 text-purple-600" />
                      <span>{activeDateLabel}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isCalendarOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {(selectedRange?.from || selectedSingleDate) && (
                      <button
                        type="button"
                        onClick={handleResetDateFilter}
                        title="Reset Filter Tanggal"
                        className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Popover */}
                  {isCalendarOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2.5rem)] max-w-sm sm:max-w-none sm:w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
                      {/* Header: Title & Close */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>Filter Tanggal Histori Login</span>
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
                          className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                            dateMode === 'range'
                              ? 'bg-white text-purple-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Rentang Tanggal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDateMode('single');
                            setSelectedRange(undefined);
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                            dateMode === 'single'
                              ? 'bg-white text-purple-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Satu Tanggal
                        </button>
                      </div>

                      {/* react-day-picker Calendar */}
                      <div className="flex justify-center bg-slate-50/70 p-2 rounded-xl border border-slate-100 overflow-x-auto">
                        {dateMode === 'range' ? (
                          <DayPicker
                            mode="range"
                            selected={selectedRange}
                            onSelect={(range) => setSelectedRange(range)}
                            locale={localeId}
                            disabled={[
                              { before: threeMonthsAgo },
                              { after: today },
                            ]}
                            className="text-xs"
                          />
                        ) : (
                          <DayPicker
                            mode="single"
                            selected={selectedSingleDate}
                            onSelect={(date) => setSelectedSingleDate(date)}
                            locale={localeId}
                            disabled={[
                              { before: threeMonthsAgo },
                              { after: today },
                            ]}
                            className="text-xs"
                          />
                        )}
                      </div>

                      <p className="text-[10px] text-center text-slate-400">
                        * Data histori login tersedia hingga 3 bulan ke belakang.
                      </p>

                      {/* Dropdown Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleResetDateFilter}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Filter
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {((isAdmin && selectedTenantId !== 'ALL') ||
              searchQuery ||
              selectedRange?.from ||
              selectedSingleDate) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">Filter aktif:</span>

                {isAdmin && selectedTenantId !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
                    <span>Tenan: {tenants.find((t) => t.id === selectedTenantId)?.name || selectedTenantId}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTenantId('ALL')}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(selectedRange?.from || selectedSingleDate) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                    <span>Tanggal: {activeDateLabel}</span>
                    <button
                      type="button"
                      onClick={handleResetDateFilter}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                    <span>Pencarian: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-slate-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTenantId('ALL');
                    setSearchQuery('');
                    handleResetDateFilter();
                  }}
                  className="text-[11px] font-bold text-red-600 hover:underline ml-1 cursor-pointer"
                >
                  Reset Semua
                </button>
              </div>
            )}
          </div>

          {/* Login History Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Catatan Sesi Masuk Terverifikasi ({filteredLogs.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                Token Berbasis Sesi Aktif
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat catatan histori login...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">
                  Tidak ada catatan histori login ditemukan
                </p>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Coba sesuaikan kata kunci pencarian, filter role pengguna, tenan, atau rentang tanggal dropdown.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTenantId('ALL');
                    setSearchQuery('');
                    handleResetDateFilter();
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Role</th>
                      {isAdmin && <th className="py-3 px-4">Toko / Tenan</th>}
                      <th className="py-3 px-4">Perangkat & Browser</th>
                      <th className="py-3 px-4">Alamat IP</th>
                      <th className="py-3 px-4">Waktu Login</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredLogs.map((log, index) => {
                      const logDate = new Date(log.createdAt);
                      const formattedDate = logDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = logDate.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const initial = (log.name || log.email || 'U')
                        .charAt(0)
                        .toUpperCase();

                      return (
                        <tr
                          key={log.id || index}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Pengguna */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 border border-purple-200">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {log.name || 'User'}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono truncate">
                                  {log.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderRoleBadge(log.role)}
                          </td>

                          {/* Toko / Tenan (Only shown or prominent for Admin) */}
                          {isAdmin && (
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold">
                                  {log.tenantName || 'Platform Administrator'}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Perangkat & Browser */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 max-w-xs">
                              {getDeviceIcon(log.device)}
                              <span className="text-[11px] font-medium text-slate-700 truncate" title={log.device}>
                                {log.device || 'Browser Client'}
                              </span>
                            </div>
                          </td>

                          {/* Alamat IP */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{log.ipAddress || '127.0.0.1'}</span>
                            </div>
                          </td>

                          {/* Waktu Login */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-bold text-slate-800">
                                {formattedDate}
                              </span>
                              <span className="text-slate-400 font-mono">
                                {formattedTime} WIB
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {log.status?.toLowerCase() === 'berhasil' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200/70">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span>Berhasil</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/70">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span>{log.status || 'Gagal'}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryPage;
