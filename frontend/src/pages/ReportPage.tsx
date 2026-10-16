import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Package,
  Clock,
  ArrowUpRight,
  CalendarRange,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';

interface ReportPageProps {
  onNavigate?: (tab: any) => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getReportSummary()
      .then((res) => {
        if (res.success && res.data) {
          setSummary(res.data);
        }
      })
      .catch((err) => console.warn('Report summary err:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="reports" onNavigate={onNavigate} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Laporan & Ringkasan Warung
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pantau omset penjualan, jumlah transaksi, dan stok barang secara real-time.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Omset Penjualan
            </span>
            <div className="text-2xl font-extrabold text-[#16A34A] tabular-nums mt-1.5">
              Rp{(summary?.totalRevenue || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              Transaksi lunas tercatat
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Transaksi Selesai
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1.5">
              {summary?.totalTransactions || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Nota pembayaran sukses</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pesanan Disimpan
            </span>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1.5">
              {summary?.savedOrdersCount || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Draft belum dibayar</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Item Produk
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1.5">
              {summary?.totalProducts || 8}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Dalam katalog warung</p>
          </div>
        </div>

        {/* Retention & History Navigation Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Riwayat Transaksi Penjualan (Retensi 3 Bulan)
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Data transaksi disimpan selama tiga bulan dengan scheduler pembersihan otomatis setiap pukul 00:00.
              Gunakan filter tanggal dan Range Mode pada menu Riwayat.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('history')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Buka Riwayat Transaksi
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
