import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Calendar,
  CalendarRange,
  ChevronDown,
  Search,
  X,
  RefreshCw,
  Building2,
  Users,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
  Ban,
  Copy,
  Check,
  ShieldCheck,
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
import {
  useActiveTokens,
  useTenants,
  useBlacklistToken,
} from '../hooks/useQueries.ts';
import { ActiveTokenItem } from '../services/api.ts';

interface ActiveTokensPageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

type DateSelectionMode = 'range' | 'single';

export const ActiveTokensPage: React.FC<ActiveTokensPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isManager =
    user?.role === 'MANAGER' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik';

  // Filters
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date filter using react-day-picker in dropdown
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateMode, setDateMode] = useState<DateSelectionMode>('range');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Blacklist confirmation modal state
  const [tokenToBlacklist, setTokenToBlacklist] = useState<ActiveTokenItem | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('Pencabutan manual oleh pengelola');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live countdown ticker (updates every second)
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Tenan list for Admin
  const { data: tenantsData } = useTenants({ enabled: isAdmin });
  const tenants = tenantsData?.data || [];

  // Date range ISO strings
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

  // Query active tokens from Redis
  const {
    data: tokensData,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useActiveTokens({
    tenantId: isAdmin ? selectedTenantId : undefined,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    search: searchQuery,
  });

  const blacklistMutation = useBlacklistToken();

  const rawTokens: ActiveTokenItem[] = tokensData?.data || [];

  // Local filter for instant responsiveness
  const filteredTokens = useMemo(() => {
    return rawTokens.filter((item) => {
      // Tenant filter for Admin
      if (isAdmin && selectedTenantId !== 'ALL') {
        if (item.tenantId && item.tenantId !== selectedTenantId) {
          return false;
        }
      }

      // Date filter
      if (item.issuedAt) {
        const itemDate = new Date(item.issuedAt);
        if (dateMode === 'range' && selectedRange?.from) {
          const from = startOfDay(selectedRange.from);
          const to = selectedRange.to
            ? endOfDay(selectedRange.to)
            : endOfDay(selectedRange.from);
          if (!isWithinInterval(itemDate, { start: from, end: to })) {
            return false;
          }
        } else if (dateMode === 'single' && selectedSingleDate) {
          if (!isSameDay(itemDate, selectedSingleDate)) {
            return false;
          }
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesEmail = item.email?.toLowerCase().includes(q);
        const matchesUsername = item.username?.toLowerCase().includes(q);
        const matchesDevice = item.device?.toLowerCase().includes(q);
        const matchesIp = item.ipAddress?.toLowerCase().includes(q);
        const matchesTenant = item.tenantName?.toLowerCase().includes(q);
        const matchesRole = item.role?.toLowerCase().includes(q);
        const matchesToken = item.token?.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesUsername &&
          !matchesDevice &&
          !matchesIp &&
          !matchesTenant &&
          !matchesRole &&
          !matchesToken
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    rawTokens,
    selectedTenantId,
    isAdmin,
    dateMode,
    selectedRange,
    selectedSingleDate,
    searchQuery,
  ]);

  // Date picker retention boundaries
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);

  const handleResetDateFilter = () => {
    setSelectedRange(undefined);
    setSelectedSingleDate(undefined);
    setIsCalendarOpen(false);
  };

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

  // Format live remaining seconds
  const getRemainingTime = (expiresAtStr: string, fallbackSeconds?: number) => {
    const expiresMs = new Date(expiresAtStr).getTime();
    const diffSeconds = Math.max(0, Math.floor((expiresMs - currentTimeMs) / 1000));
    const sec = isNaN(diffSeconds) ? fallbackSeconds || 0 : diffSeconds;

    if (sec <= 0) return { label: 'Kedaluwarsa', seconds: 0, status: 'expired' };

    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    const label = `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;

    if (sec > 300) return { label, seconds: sec, status: 'active' };
    if (sec > 60) return { label, seconds: sec, status: 'warning' };
    return { label, seconds: sec, status: 'critical' };
  };

  // Copy token helper
  const handleCopyToken = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Blacklist handler
  const handleConfirmBlacklist = async () => {
    if (!tokenToBlacklist) return;
    try {
      await blacklistMutation.mutateAsync({
        token: tokenToBlacklist.token,
        reason: blacklistReason,
      });
      setToastMessage(
        `Token milik ${tokenToBlacklist.name} (${tokenToBlacklist.email}) berhasil dimasukkan ke daftar hitam Redis.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setTokenToBlacklist(null);
    } catch (err: any) {
      alert(err.message || 'Gagal memblacklist access token');
    }
  };

  // Role badge helper
  const renderRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
          <KeyRound className="w-3 h-3" />
          <span>ADMIN</span>
        </span>
      );
    }
    if (r === 'SHOP_OWNER' || r === 'PEMILIK' || r === 'MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
          <Users className="w-3 h-3" />
          <span>MANAGER</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span>KASIR</span>
      </span>
    );
  };

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      {/* Top Navigation */}
      <TopNavbar currentTab="active-tokens" onNavigate={onNavigate} />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Toast message */}
          {toastMessage && (
            <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}



          {/* Filter Bar with TenantSelect & react-day-picker Dropdown */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, username, IP, perangkat, atau token..."
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

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. TenantSelect (Hanya Role ADMIN) */}
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

                  {/* Dropdown Panel */}
                  {isCalendarOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2.5rem)] max-w-sm sm:max-w-none sm:w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>Filter Tanggal Sesi Terbit</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

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
                        * Data sesi aktif dapat difilter berdasarkan waktu diterbitkan.
                      </p>

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

            {/* Active filter badges */}
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

          {/* Active Tokens Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Sesi Access Token Aktif ({filteredTokens.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-semibold">Live Redis Sync</span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat sesi access token dari Redis...</p>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <KeyRound className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">
                  Tidak ada access token aktif yang ditemukan
                </p>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Semua sesi mungkin telah kedaluwarsa, telah dicabut/diblacklist, atau tidak cocok dengan filter pencarian.
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
                  Reset Filter
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
                      <th className="py-3 px-4">Perangkat & IP</th>
                      <th className="py-3 px-4">Masa Aktif & TTL</th>
                      <th className="py-3 px-4">Token Preview</th>
                      <th className="py-3 px-4 text-center">Aksi Blacklist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredTokens.map((item, index) => {
                      const countdown = getRemainingTime(
                        item.expiresAt,
                        item.remainingSeconds
                      );
                      const initial = (item.name || item.email || 'U')
                        .charAt(0)
                        .toUpperCase();
                      const tokenSnippet = `${item.token.substring(0, 14)}...${item.token.substring(
                        item.token.length - 8
                      )}`;

                      return (
                        <tr
                          key={item.token || index}
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
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono truncate">
                                  {item.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderRoleBadge(item.role)}
                          </td>

                          {/* Toko / Tenan */}
                          {isAdmin && (
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold">
                                  {item.tenantName || 'Platform Administrator'}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Perangkat & IP */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 max-w-xs">
                              <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                                {getDeviceIcon(item.device)}
                                <span className="text-[11px] truncate" title={item.device}>
                                  {item.device}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.ipAddress}</span>
                              </div>
                            </div>
                          </td>

                          {/* Sisa Masa Aktif (Countdown TTL) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                                    countdown.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : countdown.status === 'warning'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{countdown.label}</span>
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                Terbit: {format(new Date(item.issuedAt), 'HH:mm:ss')} WIB
                              </p>
                            </div>
                          </td>

                          {/* Token Preview & Copy */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/70 w-fit">
                              <span className="font-mono text-[10px] text-slate-600">
                                {tokenSnippet}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyToken(item.token)}
                                title="Salin JWT Token Lengkap"
                                className="text-slate-400 hover:text-purple-600 p-0.5 rounded transition-colors"
                              >
                                {copiedToken === item.token ? (
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Aksi Blacklist Token */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setTokenToBlacklist(item);
                                setBlacklistReason(
                                  isAdmin
                                    ? `Pencabutan darurat oleh Administrator`
                                    : `Pencabutan sesi oleh Manajer Toko`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                              title="Blacklist token di Redis & cabut sesi"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Blacklist Token</span>
                            </button>
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

      {/* Confirmation Modal to Blacklist Token */}
      {tokenToBlacklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Konfirmasi Blacklist Access Token
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesi ini akan segera dicabut dan dinonaktifkan di Redis.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Pengguna:</span>
                <span className="font-bold text-slate-900">{tokenToBlacklist.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email / Akun:</span>
                <span className="font-mono text-slate-700">{tokenToBlacklist.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Role Pengguna:</span>
                <span>{renderRoleBadge(tokenToBlacklist.role)}</span>
              </div>
              {tokenToBlacklist.tenantName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Toko / Tenan:</span>
                  <span className="font-bold text-slate-900">{tokenToBlacklist.tenantName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sisa TTL Redis:</span>
                <span className="font-mono font-bold text-red-600">
                  {getRemainingTime(tokenToBlacklist.expiresAt, tokenToBlacklist.remainingSeconds).label}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Pencabutan / Blacklist:
              </label>
              <input
                type="text"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="Contoh: Pergantian shift / dugaan akses mencurigakan"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Token yang di-blacklist akan disimpan di daftar hitam Redis dengan TTL sesuai sisa masa aktifnya. Seluruh request dari pengguna dengan token ini akan langsung ditolak (401 Unauthorized).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTokenToBlacklist(null)}
                disabled={blacklistMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmBlacklist}
                disabled={blacklistMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                {blacklistMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memblacklist...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Ya, Blacklist Token</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveTokensPage;
