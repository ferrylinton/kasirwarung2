import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Package,
  Receipt,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Power,
  ShieldCheck,
  Ban,
  Clock,
  Tags,
} from 'lucide-react';
import { api, Tenant } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface TenantsPageProps {
  onBackToPos?: () => void;
  onNavigate?: (tab: any) => void;
}

export const TenantsPage: React.FC<TenantsPageProps> = ({ onNavigate }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.getTenants();
      if (res.success && Array.isArray(res.data)) {
        setTenants(res.data);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memuat data tenan', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (tenant: Tenant, newStatus: 'active' | 'inactive') => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.updateTenantStatus(tenant.id, newStatus);
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        await fetchTenants();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memperbarui status toko', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewDeactivation = async (tenantId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.reviewDeactivation(tenantId, action);
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        await fetchTenants();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memproses permintaan', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q)
    );
  });

  const pendingRequests = tenants.filter(
    (t) => t.deactivationRequest && t.deactivationRequest.status === 'pending'
  );

  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const inactiveCount = tenants.filter((t) => t.status === 'inactive').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="tenants" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Kelola Tenan & Toko
                </h1>
                <p className="text-xs md:text-sm text-slate-500">
                  Panel Administrator Platform untuk mengontrol tenan, status operasional, dan permintaan penonaktifan.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate?.('admin-products')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl text-xs md:text-sm font-bold text-purple-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-purple-600" />
              <span>Semua Produk Tenan</span>
            </button>

            <button
              onClick={() => onNavigate?.('admin-categories')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl text-xs md:text-sm font-bold text-purple-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Tags className="w-4 h-4 text-purple-600" />
              <span>Semua Kategori Tenan</span>
            </button>

            <button
              onClick={fetchTenants}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
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
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">
              Tutup
            </button>
          </div>
        )}

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Total Toko / Tenan</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{tenants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Toko Aktif</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Toko Dinonaktifkan</span>
            <p className="text-2xl font-bold text-red-600 mt-1">{inactiveCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Permintaan Nonaktif</span>
            <p className="text-2xl font-bold text-orange-600 mt-1">{pendingRequests.length}</p>
          </div>
        </div>

        {/* Section: Pending Deactivation Requests Review */}
        {pendingRequests.length > 0 && (
          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm md:text-base font-bold">
                Permintaan Penonaktifan Toko ({pendingRequests.length} Menunggu Review)
              </h2>
            </div>
            <p className="text-xs text-orange-700 leading-relaxed">
              Pemilik toko berikut telah mengajukan penonaktifan akun tenan. Anda dapat menyetujui (semua user di toko tidak dapat login) atau menolak permintaan tersebut.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {pendingRequests.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-4 border border-orange-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                      <p className="text-xs font-mono text-slate-500">{t.code} • {t.ownerEmail}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                      Menunggu Review
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium block">Alasan Pengajuan:</span>
                    <p className="text-slate-700 italic mt-0.5">"{t.deactivationRequest?.reason}"</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReviewDeactivation(t.id, 'reject')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleReviewDeactivation(t.id, 'approve')}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      Setujui & Nonaktifkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Tenants Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="text-sm md:text-base font-bold text-slate-800">
              Daftar Seluruh Tenan Toko
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko, kode, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Toko / Tenan</th>
                  <th className="py-3 px-4">Pemilik Toko</th>
                  <th className="py-3 px-4 text-center">Kasir</th>
                  <th className="py-3 px-4 text-center">Produk</th>
                  <th className="py-3 px-4 text-center">Pesanan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {loading ? 'Memuat daftar tenan...' : 'Tidak ada data toko ditemukan'}
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const isInactive = tenant.status === 'inactive';
                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{tenant.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">{tenant.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {tenant.ownerEmail}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {tenant.cashierCount ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {tenant.productCount ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {tenant.orderCount ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                              <Ban className="w-3 h-3" />
                              Nonaktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                              <ShieldCheck className="w-3 h-3" />
                              Aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isInactive ? (
                            <button
                              onClick={() => handleToggleStatus(tenant, 'active')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>Aktifkan</span>
                            </button>
                          ) : (
                            <AlertDialog.Root>
                              <AlertDialog.Trigger asChild>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>Nonaktifkan</span>
                                </button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Portal>
                                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 focus:outline-none">
                                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                                    <Ban className="w-5 h-5" />
                                  </div>
                                  <AlertDialog.Title className="text-base font-bold text-slate-900">
                                    Nonaktifkan Toko '{tenant.name}'?
                                  </AlertDialog.Title>
                                  <AlertDialog.Description className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    Jika dinonaktifkan, <strong>seluruh user (pemilik dan kasir) di dalam tenan ini tidak akan dapat login</strong> ke aplikasi.
                                  </AlertDialog.Description>
                                  <div className="flex items-center justify-end gap-2.5 mt-5">
                                    <AlertDialog.Cancel asChild>
                                      <button
                                        type="button"
                                        className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                      >
                                        Batal
                                      </button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(tenant, 'inactive')}
                                        className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                                      >
                                        Ya, Nonaktifkan
                                      </button>
                                    </AlertDialog.Action>
                                  </div>
                                </AlertDialog.Content>
                              </AlertDialog.Portal>
                            </AlertDialog.Root>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
