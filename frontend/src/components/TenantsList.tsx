import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Power,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { api, Tenant } from '../services/api.ts';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export interface TenantsListProps {
  tenants?: Tenant[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
  onNavigate?: (tab: any) => void;
}

export const TenantsList: React.FC<TenantsListProps> = ({
  tenants: propTenants,
  loading: propLoading,
  onRefresh,
}) => {
  const [internalTenants, setInternalTenants] = useState<Tenant[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isControlled = propTenants !== undefined;
  const tenants = isControlled ? propTenants : internalTenants;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  const fetchTenants = async () => {
    if (onRefresh) {
      await onRefresh();
      return;
    }
    setInternalLoading(true);
    try {
      const res = await api.getTenants();
      if (res.success && Array.isArray(res.data)) {
        setInternalTenants(res.data);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memuat data tenan', type: 'error' });
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!isControlled) {
      fetchTenants();
    }
  }, [isControlled]);

  const handleToggleStatus = async (tenant: Tenant, newStatus: 'active' | 'inactive') => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.updateTenantStatus(tenant.id, newStatus);
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        if (onRefresh) {
          await onRefresh();
        } else {
          await fetchTenants();
        }
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memperbarui status toko', type: 'error' });
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

  return (
    <div className="space-y-4">
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
    </div>
  );
};
