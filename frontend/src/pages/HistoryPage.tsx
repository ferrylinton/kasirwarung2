import React, { useEffect, useState } from 'react';
import {
  History,
  ArrowLeft,
  Receipt,
  Search,
  CheckCircle,
  Banknote,
  QrCode,
  CreditCard,
  RefreshCw,
  TrendingUp,
  User,
  Calendar,
  Eye,
} from 'lucide-react';
import { Order, api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';

interface HistoryPageProps {
  onBackToPos: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onBackToPos, onNavigate }) => {
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('Semua');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    api
      .getOrderHistory()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setHistoryOrders(res.data);
        }
      })
      .catch((err) => console.warn('Fetch history err:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered orders
  const filteredOrders = historyOrders.filter((order) => {
    const matchesSearch =
      order.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.cashierName && order.cashierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod =
      selectedMethod === 'Semua' || order.paymentMethod === selectedMethod;

    return matchesSearch && matchesMethod;
  });

  // Calculate statistics
  const totalCompletedOrders = historyOrders.length;
  const totalRevenue = historyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageTicket =
    totalCompletedOrders > 0 ? Math.round(totalRevenue / totalCompletedOrders) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="history" onNavigate={onNavigate} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Top Actions & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={onBackToPos}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 hover:text-orange-600 bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-all self-start cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Kasir POS</span>
            </button>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 hover:text-orange-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Segarkan Riwayat</span>
            </button>
          </div>

          {/* Title Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Transaksi Penjualan
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Catatan lengkap nota transaksi kasir lunas, riwayat kasir, metode pembayaran, dan rincian belanjaan pelanggan.
            </p>
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
                Semua transaksi berhasil dibayar
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

          {/* Search & Method Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor nota (cth: INV/2025/...), pelanggan, atau kasir..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['Semua', 'Tunai', 'QRIS', 'Transfer'].map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    selectedMethod === method
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction History List Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Transaksi Kasir ({filteredOrders.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Data Terverifikasi POS</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Memuat data transaksi penjualan...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Tidak ada transaksi yang cocok dengan kriteria pencarian.
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

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            order.paymentMethod === 'Tunai'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : order.paymentMethod === 'QRIS'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                              : 'bg-purple-50 text-purple-800 border border-purple-200/60'
                          }`}
                        >
                          {order.paymentMethod === 'Tunai' && <Banknote className="w-3 h-3" />}
                          {order.paymentMethod === 'QRIS' && <QrCode className="w-3 h-3" />}
                          {order.paymentMethod === 'Transfer' && <CreditCard className="w-3 h-3" />}
                          <span>{order.paymentMethod || 'Tunai'}</span>
                        </span>

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
                          {order.timeLabel || 'Hari ini'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">Item: </span>
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="mr-1">
                            {item.name} <span className="font-mono text-slate-400">(x{item.qty})</span>
                            {idx < (order.items?.length || 0) - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400 block">Total Transaksi</span>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="text-center pb-2 border-b border-dashed border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">STRUK KASIR WARUNG</h3>
              <p className="font-mono text-xs text-slate-500 mt-0.5">{selectedOrder.invoiceNo}</p>
            </div>

            <div className="space-y-1.5 text-xs divide-y divide-slate-100">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between">
                  <span>
                    {item.name} <span className="text-slate-400">x{item.qty}</span>
                  </span>
                  <span className="font-mono font-semibold">
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
                <span>Metode Pembayaran:</span>
                <span className="font-semibold">{selectedOrder.paymentMethod || 'Tunai'}</span>
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
