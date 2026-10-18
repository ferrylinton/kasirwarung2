import React, { useEffect, useState, useMemo, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Receipt,
  Search,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  User,
  Calendar,
  Eye,
  Building2,
  ChevronDown,
  ChevronUp,
  Check,
  Store,
  CalendarRange,
  Clock,
  X,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Order, Tenant, api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  useOrderHistory,
  useTenants,
  useCleanupOldOrdersMutation,
} from '../hooks/useQueries.ts';

interface HistoryPageProps {
  onBackToPos: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

type DateSelectionMode = 'range' | 'single';

export const HistoryPage: React.FC<HistoryPageProps> = ({ onBackToPos, onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Data states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Tenant filter state (ADMIN only)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');

  // Date filter states using react-day-picker
  const [dateMode, setDateMode] = useState<DateSelectionMode>('range');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Cleanup action status
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Boundary: max 3 months retention
  const threeMonthsAgo = useMemo(() => subMonths(new Date(), 3), []);
  const today = useMemo(() => new Date(), []);

  // Compute ISO date range params
  const { startIso, endIso } = useMemo(() => {
    let s: string | undefined;
    let e: string | undefined;

    if (dateMode === 'range' && selectedRange?.from) {
      s = format(startOfDay(selectedRange.from), 'yyyy-MM-dd');
      if (selectedRange.to) {
        e = format(endOfDay(selectedRange.to), 'yyyy-MM-dd');
      } else {
        e = s;
      }
    } else if (dateMode === 'single' && selectedSingleDate) {
      s = format(startOfDay(selectedSingleDate), 'yyyy-MM-dd');
      e = format(endOfDay(selectedSingleDate), 'yyyy-MM-dd');
    }
    return { startIso: s, endIso: e };
  }, [dateMode, selectedRange, selectedSingleDate]);

  const tenantQuery = isAdmin ? selectedTenantId : undefined;

  // TanStack Query: Fetch order history with caching & reactivity
  const {
    data: historyOrdersData,
    isLoading: loading,
    isFetching,
    refetch: fetchOrders,
  } = useOrderHistory(tenantQuery, startIso, endIso);

  const historyOrders = historyOrdersData?.data || [];

  // TanStack Query: Fetch tenants for ADMIN
  const { data: tenantsData } = useTenants({ enabled: isAdmin });
  const tenants = tenantsData?.data || [];

  // TanStack Mutation: Trigger 3-month retention cleanup
  const cleanupMutation = useCleanupOldOrdersMutation();
  const cleaningUp = cleanupMutation.isPending;

  // Quick preset helper
  const applyPreset = (preset: 'today' | '7days' | '30days' | 'month' | 'all') => {
    if (preset === 'all') {
      setSelectedRange(undefined);
      setSelectedSingleDate(undefined);
      setIsCalendarOpen(false);
      return;
    }

    setDateMode('range');
    const now = new Date();

    if (preset === 'today') {
      setSelectedRange({ from: startOfDay(now), to: endOfDay(now) });
    } else if (preset === '7days') {
      setSelectedRange({ from: startOfDay(subDays(now, 7)), to: endOfDay(now) });
    } else if (preset === '30days') {
      setSelectedRange({ from: startOfDay(subDays(now, 30)), to: endOfDay(now) });
    } else if (preset === 'month') {
      setSelectedRange({ from: startOfMonth(now), to: endOfMonth(now) });
    }
    setIsCalendarOpen(false);
  };

  // Filtered orders client-side (search query + date range validation)
  const filteredOrders = useMemo(() => {
    return historyOrders.filter((order) => {
      // Search matching: invoiceNo, customer, cashier, items, or tenant
      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const inInvoice = order.invoiceNo?.toLowerCase().includes(q);
        const inCustomer = order.customerName?.toLowerCase().includes(q);
        const inCashier = order.cashierName?.toLowerCase().includes(q);
        const inTenant = order.tenantName?.toLowerCase().includes(q);
        const inItems = order.items?.some((i) => i.name.toLowerCase().includes(q));
        matchesSearch = Boolean(inInvoice || inCustomer || inCashier || inTenant || inItems);
      }

      // Date matching
      let matchesDate = true;
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        if (dateMode === 'range' && selectedRange?.from) {
          const from = startOfDay(selectedRange.from);
          const to = selectedRange.to ? endOfDay(selectedRange.to) : endOfDay(selectedRange.from);
          matchesDate = isWithinInterval(orderDate, { start: from, end: to });
        } else if (dateMode === 'single' && selectedSingleDate) {
          matchesDate = isSameDay(orderDate, selectedSingleDate);
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [historyOrders, searchQuery, dateMode, selectedRange, selectedSingleDate]);

  // Statistics calculation
  const totalCompletedOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageTicket =
    totalCompletedOrders > 0 ? Math.round(totalRevenue / totalCompletedOrders) : 0;

  // Active date filter description label
  const activeDateLabel = useMemo(() => {
    if (dateMode === 'range' && selectedRange?.from) {
      if (selectedRange.to && !isSameDay(selectedRange.from, selectedRange.to)) {
        return `${format(selectedRange.from, 'd MMM yyyy', { locale: localeId })} - ${format(
          selectedRange.to,
          'd MMM yyyy',
          { locale: localeId }
        )}`;
      }
      return format(selectedRange.from, 'd MMMM yyyy', { locale: localeId });
    }
    if (dateMode === 'single' && selectedSingleDate) {
      return format(selectedSingleDate, 'd MMMM yyyy', { locale: localeId });
    }
    return 'Semua Waktu (Maksimal 3 Bulan)';
  }, [dateMode, selectedRange, selectedSingleDate]);

  // Manual cleanup trigger for Admin using TanStack Mutation
  const handleTriggerCleanup = async () => {
    try {
      const res: any = await cleanupMutation.mutateAsync();
      setCleanupMessage(res?.message || 'Pembersihan otomatis berhasil dijalankan.');
    } catch (err: any) {
      setCleanupMessage('Gagal membersihkan data: ' + (err.message || 'Error server'));
    } finally {
      setTimeout(() => setCleanupMessage(null), 6000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="history" onNavigate={onNavigate} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Top Actions & Retention Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={onBackToPos}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 hover:text-orange-600 bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-all self-start cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Kasir POS</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 hover:text-orange-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
                <span>Segarkan</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleTriggerCleanup}
                  disabled={cleaningUp}
                  title="Jalankan scheduler pembersihan data > 3 bulan sekarang"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{cleaningUp ? 'Membersihkan...' : 'Jalankan Cleanup 00:00'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Title Header with Retention Notice */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Riwayat Transaksi Penjualan
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200/60">
                  <Clock className="w-3 h-3 text-orange-600" />
                  <span>Retensi 3 Bulan</span>
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Catatan lengkap nota transaksi penjualan lunas, riwayat kasir, rincian tanggal, dan belanjaan pelanggan.
              </p>
            </div>

            {/* Tenant Scoping Badge / Dropdown */}
            <div>
              {isAdmin ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Pilih Tenan:</span>
                  {/* Radix UI Select primitive for ADMIN tenant filtering */}
                  <Select.Root value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <Select.Trigger className="inline-flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 shadow-2xs hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-500 shrink-0" />
                        <Select.Value placeholder="Pilih Tenan" />
                      </div>
                      <Select.Icon>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Select.Icon>
                    </Select.Trigger>

                    <Select.Portal>
                      <Select.Content
                        position="popper"
                        sideOffset={6}
                        className="z-50 min-w-[220px] max-h-[300px] overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 animate-in fade-in-80"
                      >
                        <Select.ScrollUpButton className="flex items-center justify-center h-6 text-slate-500">
                          <ChevronUp className="w-4 h-4" />
                        </Select.ScrollUpButton>

                        <Select.Viewport className="p-1">
                          <Select.Item
                            value="ALL"
                            className="relative flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 rounded-xl outline-none select-none hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer transition-colors"
                          >
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <Select.ItemText>Semua Tenan (Pusat)</Select.ItemText>
                            <Select.ItemIndicator className="ml-auto text-orange-600">
                              <Check className="w-4 h-4" />
                            </Select.ItemIndicator>
                          </Select.Item>

                          {tenants.map((t) => (
                            <Select.Item
                              key={t.id}
                              value={t.id}
                              className="relative flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 rounded-xl outline-none select-none hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer transition-colors"
                            >
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <Select.ItemText>{t.name}</Select.ItemText>
                              <Select.ItemIndicator className="ml-auto text-orange-600">
                                <Check className="w-4 h-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>

                        <Select.ScrollDownButton className="flex items-center justify-center h-6 text-slate-500">
                          <ChevronDown className="w-4 h-4" />
                        </Select.ScrollDownButton>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              ) : (
                /* SHOP_OWNER & CASHIER: Scoped to their own tenant automatically */
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  <span>Tenan: {user?.tenantName || 'Warung Berkah Budi'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Retention Information Banner */}
          <div className="bg-orange-50/80 border border-orange-200/70 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-orange-950">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <span className="font-bold">Kebijakan Retensi 3 Bulan: </span>
                <span>
                  Sistem menyimpan riwayat transaksi selama 3 bulan terakhir. Scheduler otomatis berjalan setiap hari
                  pukul <strong>00:00</strong> untuk menghapus transaksi yang telah melampaui 3 bulan.
                </span>
              </div>
            </div>

            {cleanupMessage && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg shrink-0">
                {cleanupMessage}
              </span>
            )}
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Transaksi Selesai
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {totalCompletedOrders} Nota
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                Semua transaksi berhasil lunas
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Pemasukan Transaksi
              </span>
              <div className="text-2xl font-extrabold text-[#16A34A] tabular-nums mt-1">
                Rp{totalRevenue.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                Omset bersih warung
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Rata-rata Nilai Belanja
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                Rp{averageTicket.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Rata-rata per struk belanja</p>
            </div>
          </div>

          {/* Filters Bar: Search & react-day-picker Calendar Range */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor nota, pelanggan, kasir, tenan, atau item produk..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/50"
                />
              </div>

              {/* Date Filter Trigger Button */}
              <div className="relative">
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                    selectedRange?.from || selectedSingleDate
                      ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 text-orange-600" />
                  <span>{activeDateLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {(selectedRange?.from || selectedSingleDate) && (
                  <button
                    onClick={() => applyPreset('all')}
                    title="Reset Filter Tanggal"
                    className="ml-2 inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">
                Pilihan Cepat:
              </span>
              <button
                onClick={() => applyPreset('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  !selectedRange?.from && !selectedSingleDate
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua (3 Bulan)
              </button>
              <button
                onClick={() => applyPreset('today')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Hari Ini
              </button>
              <button
                onClick={() => applyPreset('7days')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => applyPreset('30days')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                30 Hari Terakhir
              </button>
              <button
                onClick={() => applyPreset('month')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Bulan Ini
              </button>
            </div>

            {/* react-day-picker Interactive Panel */}
            {isCalendarOpen && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Mode Kalender:</span>
                    <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200">
                      <button
                        onClick={() => {
                          setDateMode('range');
                          setSelectedSingleDate(undefined);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          dateMode === 'range'
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Rentang Tanggal (Range Mode)
                      </button>
                      <button
                        onClick={() => {
                          setDateMode('single');
                          setSelectedRange(undefined);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          dateMode === 'single'
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Satu Tanggal
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => applyPreset('all')}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                <div className="flex justify-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
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
                      className="text-xs md:text-sm"
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
                      className="text-xs md:text-sm"
                    />
                  )}
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  * Rentang tanggal dibatasi hingga maksimal 3 bulan terakhir sesuai kebijakan retensi.
                </p>
              </div>
            )}
          </div>

          {/* Transaction History List Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Transaksi Penjualan ({filteredOrders.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Terverifikasi Lunas</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Memuat data riwayat transaksi penjualan...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">Tidak ada riwayat transaksi penjualan ditemukan</p>
                  <p className="text-slate-400">Coba ubah filter tanggal atau kata kunci pencarian nota.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id || order.invoiceNo}
                    className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {order.invoiceNo}
                        </span>

                        {/* Tenant badge (especially helpful for ADMIN) */}
                        {order.tenantName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{order.tenantName}</span>
                          </span>
                        )}

                        {/* Status Lunas */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/50">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Lunas</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Kasir: <strong className="text-slate-700">{order.cashierName || 'Budi Santoso'}</strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {order.createdAt
                            ? format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: localeId })
                            : order.timeLabel || 'Hari ini'}
                        </span>

                        {order.customerName && order.customerName !== 'Umum' && (
                          <span className="text-slate-600">
                            Pelanggan: <strong>{order.customerName}</strong>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">Item Belanja: </span>
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="mr-1.5">
                            {item.name} <span className="font-mono text-slate-400 font-semibold">(x{item.qty})</span>
                            {idx < (order.items?.length || 0) - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Total Transaksi</span>
                        <span className="text-base md:text-lg font-extrabold text-[#16A34A] tabular-nums">
                          Rp{order.total.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal (Receipt - No Payment Method) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="text-center pb-2 border-b border-dashed border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">STRUK KASIR WARUNG</h3>
              <p className="font-mono text-xs text-slate-500 mt-0.5">{selectedOrder.invoiceNo}</p>
              {selectedOrder.tenantName && (
                <p className="text-xs font-semibold text-orange-600 mt-0.5">{selectedOrder.tenantName}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedOrder.createdAt
                  ? format(new Date(selectedOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: localeId })
                  : selectedOrder.timeLabel || 'Waktu Transaksi'}
              </p>
            </div>

            <div className="space-y-1.5 text-xs divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between">
                  <div>
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {item.qty} x Rp{item.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">
                    Rp{(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono">Rp{selectedOrder.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PPN (11%):</span>
                <span className="font-mono">Rp{selectedOrder.tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>Total:</span>
                <span className="text-green-600">Rp{selectedOrder.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Kasir:</span>
                <span className="font-semibold text-slate-700">{selectedOrder.cashierName || 'Budi Santoso'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
