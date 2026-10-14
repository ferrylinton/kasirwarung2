import React, { useState, useEffect } from 'react';
import {
  Store,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Ban,
  ArrowLeft,
  XCircle,
  Mail,
  Info,
} from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { api, Tenant } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface StoreSettingsPageProps {
  onBackToPos?: () => void;
  onNavigate?: (tab: any) => void;
}

export const StoreSettingsPage: React.FC<StoreSettingsPageProps> = ({ onNavigate, onBackToPos }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Deactivation Request Form
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const fetchTenantInfo = async () => {
    setLoading(true);
    try {
      const res = await api.getCurrentTenant();
      if (res.success && res.data) {
        setTenant(res.data);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memuat data toko', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const handleRequestDeactivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setFeedback({ message: 'Alasan penonaktifan minimal 5 karakter', type: 'error' });
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.requestDeactivation(reason.trim());
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        setIsRequestModalOpen(false);
        setReason('');
        await fetchTenantInfo();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal mengajukan penonaktifan', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeactivation = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.cancelDeactivation();
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        await fetchTenantInfo();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal membatalkan permintaan', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const deactivationReq = tenant?.deactivationRequest;
  const isPending = deactivationReq && deactivationReq.status === 'pending';
  const isRejected = deactivationReq && deactivationReq.status === 'rejected';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="store-settings" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-orange-100 text-orange-600 shadow-2xs">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Pengaturan Toko & Akun Tenan
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                  SHOP_OWNER
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500">
                Informasi unit toko, status operasional, dan pengajuan penonaktifan tenan.
              </p>
            </div>
          </div>

          <button
            onClick={fetchTenantInfo}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs md:text-sm font-medium flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Store Detail Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tenant?.name || user?.tenantName || 'Toko Anda'}</h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">Kode Tenan: {tenant?.code || 'T-WARUNG'}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                tenant?.status === 'inactive'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {tenant?.status === 'inactive' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{tenant?.status === 'inactive' ? 'Dinonaktifkan' : 'Toko Aktif & Operasional'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email Pemilik Toko</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{tenant?.ownerEmail || user?.email}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Peran Pengguna</span>
              <p className="text-sm font-bold text-orange-600 mt-1">SHOP_OWNER (Pemilik Toko)</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">ID Tenan (ObjectId)</span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1 truncate">{tenant?.id || user?.tenantId}</p>
            </div>
          </div>
        </div>

        {/* Deactivation Request Status Card */}
        {isPending && (
          <div className="bg-amber-50/80 border border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950">
                    Permintaan Penonaktifan Toko Sedang Menunggu Review
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Permintaan telah dikirim ke Administrator sistem. Anda dapat membatalkan permintaan ini kapan saja sebelum disetujui.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 shrink-0">
                Menunggu Review
              </span>
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-amber-200/80 text-xs text-slate-700">
              <span className="font-bold text-slate-500 block mb-1">Alasan Penonaktifan yang Diajukan:</span>
              <p className="italic text-slate-800">"{deactivationReq?.reason}"</p>
              {deactivationReq?.requestedAt && (
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                  Diajukan pada: {new Date(deactivationReq.requestedAt).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button
                    disabled={actionLoading}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Batalkan Permintaan Penonaktifan
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 focus:outline-none">
                    <AlertDialog.Title className="text-base font-bold text-slate-900">
                      Batalkan Permintaan Penonaktifan?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
                      Permintaan penonaktifan toko Anda akan dibatalkan, dan toko akan tetap berjalan normal seperti biasa.
                    </AlertDialog.Description>
                    <div className="flex items-center justify-end gap-2.5 mt-5">
                      <AlertDialog.Cancel asChild>
                        <button className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                          Kembali
                        </button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <button
                          onClick={handleCancelDeactivation}
                          className="px-4 py-2 text-xs md:text-sm font-semibold bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl shadow-xs"
                        >
                          Ya, Batalkan Permintaan
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50/80 border border-red-200 rounded-3xl p-5 shadow-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-red-900">Permintaan Penonaktifan Sebelumnya Ditolak Admin</h4>
              <p className="text-red-700">
                Alasan penolakan: <strong>{deactivationReq?.rejectReason || 'Ditolak oleh Administrator'}</strong>. Toko Anda tetap beroperasi normal.
              </p>
            </div>
          </div>
        )}

        {/* Section: Request Deactivation Action */}
        {!isPending && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Penonaktifan Akun Toko (Tenan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Sebagai role <strong>SHOP_OWNER</strong>, Anda dapat mengajukan permohonan penonaktifan akun toko ke Admin.
                  Setelah disetujui Admin, <strong>seluruh user (pemilik dan kasir) di dalam tenan tidak dapat login</strong>.
                  Toko dapat diaktifkan kembali nanti dengan meminta link konfirmasi pengaktifan via email pemilik toko.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs md:text-sm border border-red-200 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                <span>Ajukan Penonaktifan Toko</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Ajukan Penonaktifan Toko */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-100 text-red-600">
                  <Ban className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Ajukan Penonaktifan Toko</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Permintaan ini akan ditinjau oleh Administrator. Selama masih berstatus menunggu review, Anda dapat membatalkannya.
              </p>
            </div>

            <form onSubmit={handleRequestDeactivation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penonaktifan Toko (Wajib)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Toko sedang renovasi sementara selama 1 bulan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-red-500"
                />
                <span className="text-[11px] text-slate-400">Minimal 5 karakter</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || reason.trim().length < 5}
                  className="px-4 py-2 text-xs md:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Mengirim...' : 'Kirim Permintaan ke Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
