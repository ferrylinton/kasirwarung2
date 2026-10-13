import React, { useEffect, useState } from 'react';
import {
  History,
  ArrowLeft,
  Laptop,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';

interface LoginHistoryPageProps {
  onBackToPos: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const LoginHistoryPage: React.FC<LoginHistoryPageProps> = ({ onBackToPos, onNavigate }) => {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    api
      .getLoginHistory()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setHistoryList(res.data);
        }
      })
      .catch((err) => console.warn('Fetch login history err:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="login-history" onNavigate={onNavigate} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToPos}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 hover:text-orange-600 bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kasir POS</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Histori Login Pengguna
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Catatan audit sesi login, IP address, dan perangkat akses aplikasi Kasir Warung.
          </p>
        </div>

        {/* History List Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                Daftar Sesi Masuk Terbaru ({historyList.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Auto-Audit Token</span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Memuat riwayat histori login...
              </div>
            ) : historyList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada catatan histori login yang tersimpan.
              </div>
            ) : (
              historyList.map((log, index) => (
                <div
                  key={log.id || index}
                  className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/60">
                      <Laptop className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs md:text-sm font-bold text-slate-900">
                          {log.device || 'POS Terminal (Desktop)'}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200/50">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>{log.status || 'Berhasil'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        IP: {log.ipAddress || '192.168.1.102'} · Akun: {log.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(log.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
