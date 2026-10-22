import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  format,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Store,
  CalendarRange,
  X,
  Sparkles,
} from 'lucide-react';
import { Order, Tenant, api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  useOrderHistory,
  useTenants,
} from '../hooks/useQueries.ts';
import { TenantSelect } from '../components/TenantSelect.tsx';

interface OrderHistoryPageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

type DateSelectionMode = 'range' | 'single';

export const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Data states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Tenant filter state (ADMIN only)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Date filter states using react-day-picker
  const [dateMode, setDateMode] = useState<DateSelectionMode>('range');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

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

  // Helper to reset date filter
  const handleResetDateFilter = () => {
    setSelectedRange(undefined);
    setSelectedSingleDate(undefined);
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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTenantId, selectedRange, selectedSingleDate, dateMode]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex]);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (activePage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages];
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="history" onNavigate={onNavigate} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          
          {/* Tenant Scoping Badge / Dropdown */}
          <div className="flex items-center justify-end">
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Pilih Tenan:</span>
                {/* Radix UI Select primitive for ADMIN tenant filtering */}
                <TenantSelect
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                  tenants={tenants}
                  allOptionLabel="Semua Tenan (Pusat)"
                  className="hover:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            ) : (
              /* SHOP_OWNER & CASHIER: Scoped to their own tenant automatically */
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span>Tenan: {user?.tenantName || 'Warung Berkah Budi'}</span>
              </div>
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

              {/* Date Filter Trigger Button & Dropdown */}
              <div className="relative" ref={calendarDropdownRef}>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
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

                {/* react-day-picker Interactive Panel as Dropdown */}
                {isCalendarOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2.5rem)] max-w-sm sm:max-w-none sm:w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
                    {/* Dropdown Header: Title & Close */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span>Filter Tanggal Transaksi</span>
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
                            ? 'bg-white text-orange-600 shadow-2xs'
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
                            ? 'bg-white text-orange-600 shadow-2xs'
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
                      * Rentang dibatasi maksimal 3 bulan terakhir (kebijakan retensi).
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
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              <div className="flex items-center gap-2">
                {totalPages > 1 && (
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                    Halaman {activePage} dari {totalPages}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">Terverifikasi Lunas</span>
              </div>
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
                paginatedOrders.map((order) => (
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

            {/* Pagination Controls */}
            {!loading && filteredOrders.length > 0 && totalPages > 1 && (
              <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center">
                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={activePage === 1}
                    title="Halaman Pertama"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    title="Halaman Sebelumnya"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((pageNum, idx) =>
                      pageNum === '...' ? (
                        <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400 select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => setCurrentPage(Number(pageNum))}
                          className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            activePage === pageNum
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    title="Halaman Berikutnya"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={activePage === totalPages}
                    title="Halaman Terakhir"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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

export const HistoryPage = OrderHistoryPage;
export default OrderHistoryPage;
