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
import { useTenants } from '../hooks/useQueries.ts';

export interface TenantsListProps {
  tenants?: Tenant[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export const TenantsList: React.FC<TenantsListProps> = ({
  tenants: propTenants,
  loading: propLoading,
  onRefresh,
}) => {
  const isControlled = propTenants !== undefined;

  // TanStack Query for tenants when not passed via props
  const {
    data: internalTenantsData,
    isLoading: internalLoading,
    refetch: refetchTenants,
  } = useTenants({ enabled: !isControlled });

  const internalTenants = internalTenantsData?.data || [];
  const tenants = isControlled ? propTenants : internalTenants;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTenants = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await refetchTenants();
    }
  };

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
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Search & Tenants Table */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-2xs overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-table-header)]">
          <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
            Daftar Seluruh Tenan Toko
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama toko, kode, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4">Toko / Tenan</th>
                <th className="py-3 px-4">Pemilik Toko</th>
                <th className="py-3 px-4 text-center">Kasir</th>
                <th className="py-3 px-4 text-center">Produk</th>
                <th className="py-3 px-4 text-center">Pesanan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs md:text-sm">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    {loading ? 'Memuat daftar tenan...' : 'Tidak ada data toko ditemukan'}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isInactive = tenant.status === 'inactive';
                  return (
                    <tr key={tenant.id} className="hover:bg-[var(--bg-table-row-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {tenant.name.substring(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{tenant.name}</p>
                            <p className="text-[11px] font-mono text-[var(--text-muted)]">{tenant.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)] font-medium">
                        {tenant.ownerEmail}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[var(--text-primary)]">
                        {tenant.cashierCount ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[var(--text-primary)]">
                        {tenant.productCount ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[var(--text-primary)]">
                        {tenant.orderCount ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                            <Ban className="w-3 h-3" />
                            Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
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
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>Nonaktifkan</span>
                              </button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Portal>
                              <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in" />
                              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-[var(--border-default)] focus:outline-none">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                                  <Ban className="w-5 h-5" />
                                </div>
                                <AlertDialog.Title className="text-base font-bold text-[var(--text-primary)]">
                                  Nonaktifkan Toko '{tenant.name}'?
                                </AlertDialog.Title>
                                <AlertDialog.Description className="text-xs md:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                                  Jika dinonaktifkan, <strong>seluruh user (pemilik dan kasir) di dalam tenan ini tidak akan dapat login</strong> ke aplikasi.
                                </AlertDialog.Description>
                                <div className="flex items-center justify-end gap-2.5 mt-5">
                                  <AlertDialog.Cancel asChild>
                                    <button
                                      type="button"
                                      className="px-3.5 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(tenant, 'inactive')}
                                      className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
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
