import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  XCircle,
  Info,
  Percent,
  Save,
  Check,
  Calculator,
  Globe,
  Moon,
} from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { api, Tenant } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrentTenant } from '../hooks/useQueries.ts';
import { LanguageSelector } from '../components/LanguageSelector.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';

export const StoreSettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // TanStack Query for current tenant
  const {
    data: tenantData,
    isLoading: loading,
    refetch: fetchTenantInfo,
  } = useCurrentTenant();
  const tenant = tenantData?.data || null;

  // PPN / Tax Settings State
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(11);
  const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');
  const [isSavingTax, setIsSavingTax] = useState(false);

  useEffect(() => {
    if (tenant) {
      setTaxEnabled(tenant.taxEnabled !== undefined ? Boolean(tenant.taxEnabled) : true);
      setTaxRate(typeof tenant.taxRate === 'number' ? tenant.taxRate : 11);
      setTaxType(tenant.taxType || 'percentage');
    }
  }, [tenant]);

  const handleSaveTaxSettings = async () => {
    setIsSavingTax(true);
    setFeedback(null);
    try {
      const numRate = Number(taxRate);
      if (isNaN(numRate) || numRate < 0) {
        setFeedback({ message: 'Nominal atau tarif pajak tidak boleh negatif', type: 'error' });
        return;
      }
      const res = await api.updateTenantSettings({
        taxEnabled,
        taxRate: numRate,
        taxType,
      });
      if (res.success) {
        setFeedback({ message: res.message || 'Pengaturan PPN toko berhasil disimpan', type: 'success' });
        await fetchTenantInfo();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal menyimpan pengaturan PPN', type: 'error' });
    } finally {
      setIsSavingTax(false);
    }
  };

  // Sample calculations for live preview
  const sampleSubtotal = 100000;
  const sampleTax = taxEnabled
    ? taxType === 'percentage'
      ? Math.round(sampleSubtotal * (Number(taxRate || 0) / 100))
      : Math.round(Number(taxRate || 0))
    : 0;
  const sampleTotal = sampleSubtotal + sampleTax;

  // Deactivation Request Form
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reason, setReason] = useState('');

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <TopNavbar currentTab="store-settings" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs md:text-sm font-medium flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
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

        {/* Store Detail Card */}
        <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl p-6 border border-[var(--border-default)] dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{tenant?.name || user?.tenantName || t('settings.storeDetailTitle', 'Toko Anda')}</h2>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{t('settings.storeCode', 'Kode Tenan')}: {tenant?.code || 'T-WARUNG'}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                tenant?.status === 'inactive'
                  ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {tenant?.status === 'inactive' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{tenant?.status === 'inactive' ? t('settings.storeInactive', 'Dinonaktifkan') : t('settings.storeActive', 'Toko Aktif & Operasional')}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] dark:bg-slate-800/60 border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{t('settings.storeOwnerEmail', 'Email Pemilik Toko')}</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{tenant?.ownerEmail || user?.email}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] dark:bg-slate-800/60 border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{t('settings.userRole', 'Peran Pengguna')}</span>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1">SHOP_OWNER</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] dark:bg-slate-800/60 border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{t('settings.tenantId', 'ID Tenan (ObjectId)')}</span>
              <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1 truncate">{tenant?.id || user?.tenantId}</p>
            </div>
          </div>
        </div>

        {/* Display Theme Preferences Card (Dark Mode) */}
        <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl p-6 border border-[var(--border-default)] dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Moon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t('theme.title', 'Tema Tampilan Antarmuka')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('theme.desc', 'Pilih mode Terang (Light), Gelap (Dark), atau Otomatis mengikuti Sistem.')}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <ThemeToggle variant="segmented" />
            </div>
          </div>
          <div>
            <ThemeToggle variant="cards" />
          </div>
        </div>

        {/* Language Preferences Card using Radix UI Select */}
        <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl p-6 border border-[var(--border-default)] dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#EC6C1A] dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t('settings.languageCardTitle', 'Preferensi Bahasa Aplikasi')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('settings.languageCardDesc', 'Pilih bahasa tampilan antarmuka kasir dan laporan transaksi.')}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-56">
              <LanguageSelector variant="full" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
            <span>{t('settings.languageActiveLabel', 'Bahasa Saat Ini')}:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {i18n.language?.startsWith('en') ? 'English (US)' : 'Bahasa Indonesia'}
            </span>
          </div>
        </div>

        {/* PPN / Tax Settings Card */}
        <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl p-6 border border-[var(--border-default)] dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#EC6C1A] dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Percent className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {t('settings.ppnTitle', 'Pengaturan Pajak Pertambahan Nilai (PPN)')}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      taxEnabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-default)] dark:border-slate-800'
                    }`}
                  >
                    {taxEnabled ? t('settings.ppnActiveBadge', 'PPN Aktif') : t('settings.ppnInactiveBadge', 'PPN Nonaktif')}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('settings.ppnDesc', 'Atur apakah transaksi kasir memungut PPN beserta nominal tarif persentase atau nominal tetapnya.')}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-[var(--bg-subtle)] dark:bg-slate-800/60 p-2 rounded-2xl border border-[var(--border-subtle)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.ppnStatusLabel', 'Aktifkan PPN')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={taxEnabled}
                onClick={() => setTaxEnabled(!taxEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  taxEnabled ? 'bg-[#EC6C1A]' : 'bg-[var(--border-strong)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    taxEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {taxEnabled ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                  Tipe / Format Nominal PPN
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxType('percentage');
                      if (taxRate > 100) setTaxRate(11);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      taxType === 'percentage'
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-[var(--border-default)] dark:border-slate-800 bg-[var(--bg-surface)] dark:bg-slate-900 hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">Persentase (%)</span>
                      <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                        Dihitung dari subtotal transaksi
                      </span>
                    </div>
                    {taxType === 'percentage' && (
                      <div className="w-5 h-5 rounded-full bg-[#EC6C1A] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTaxType('fixed');
                      if (taxRate <= 100) setTaxRate(2000);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      taxType === 'fixed'
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-[var(--border-default)] dark:border-slate-800 bg-[var(--bg-surface)] dark:bg-slate-900 hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">Nominal Tetap (Rp)</span>
                      <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                        Biaya pajak flat per transaksi
                      </span>
                    </div>
                    {taxType === 'fixed' && (
                      <div className="w-5 h-5 rounded-full bg-[#EC6C1A] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Nominal Input & Quick Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {taxType === 'percentage' ? 'Besaran Tarif PPN (%)' : 'Besaran Nominal PPN (Rp)'}
                  </label>
                  <div className="relative max-w-xs">
                    {taxType === 'fixed' && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        Rp
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      step={taxType === 'percentage' ? '0.1' : '500'}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                      className={`w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                        taxType === 'fixed' ? 'pl-9 pr-3' : 'pl-3.5 pr-8'
                      }`}
                    />
                    {taxType === 'percentage' && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        %
                      </span>
                    )}
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Pilihan Cepat:</span>
                    {taxType === 'percentage' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setTaxRate(10)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 10
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          10%
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaxRate(11)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 11
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          11% (Standar)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaxRate(12)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 12
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          12% (UU HPP)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setTaxRate(1000)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 1000
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          Rp1.000
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaxRate(2000)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 2000
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          Rp2.000
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaxRate(5000)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            taxRate === 5000
                              ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          Rp5.000
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    {taxType === 'percentage'
                      ? 'Tarif PPN akan dikalikan otomatis dengan total belanja produk (subtotal).'
                      : 'Nominal PPN tetap akan ditambahkan per struk belanja.'}
                  </p>
                </div>

                {/* Live Simulation Preview */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Simulasi Perhitungan Nota Kasir</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Subtotal Belanja (Contoh)</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">Rp{sampleSubtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>
                        PPN {taxType === 'percentage' ? `(${taxRate}%)` : `(Flat Rp${Number(taxRate || 0).toLocaleString('id-ID')})`}
                      </span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">+Rp{sampleTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>Total Tagihan Pelanggan</span>
                      <span className="font-mono text-sm text-slate-900 dark:text-slate-100">Rp{sampleTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>
                PPN dinonaktifkan. Transaksi kasir tidak akan dikenakan biaya pajak (PPN = Rp0, Total Tagihan = Subtotal).
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSaveTaxSettings}
              disabled={isSavingTax}
              className="px-5 py-2.5 bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingTax ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan PPN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Deactivation Request Status Card */}
        {isPending && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-850 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">
                    Permintaan Penonaktifan Toko Sedang Menunggu Review
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                    Permintaan telah dikirim ke Administrator sistem. Anda dapat membatalkan permintaan ini kapan saja sebelum disetujui.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                Menunggu Review
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/90 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Alasan Penonaktifan yang Diajukan:</span>
              <p className="italic text-slate-800 dark:text-slate-200">"{deactivationReq?.reason}"</p>
              {deactivationReq?.requestedAt && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-2 font-mono">
                  Diajukan pada: {new Date(deactivationReq.requestedAt).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button
                    disabled={actionLoading}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Batalkan Permintaan Penonaktifan
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 dark:border-slate-800 focus:outline-none">
                    <AlertDialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Batalkan Permintaan Penonaktifan?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Permintaan penonaktifan toko Anda akan dibatalkan, dan toko akan tetap berjalan normal seperti biasa.
                    </AlertDialog.Description>
                    <div className="flex items-center justify-end gap-2.5 mt-5">
                      <AlertDialog.Cancel asChild>
                        <button className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
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
          <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-3xl p-5 shadow-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-red-900 dark:text-red-200">Permintaan Penonaktifan Sebelumnya Ditolak Admin</h4>
              <p className="text-red-700 dark:text-red-300">
                Alasan penolakan: <strong>{deactivationReq?.rejectReason || 'Ditolak oleh Administrator'}</strong>. Toko Anda tetap beroperasi normal.
              </p>
            </div>
          </div>
        )}

        {/* Section: Request Deactivation Action */}
        {!isPending && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Penonaktifan Akun Toko (Tenan)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Sebagai role <strong>SHOP_OWNER</strong>, Anda dapat mengajukan permohonan penonaktifan akun toko ke Admin.
                  Setelah disetujui Admin, <strong>seluruh user (pemilik dan kasir) di dalam tenan tidak dapat login</strong>.
                  Toko dapat diaktifkan kembali nanti dengan meminta link konfirmasi pengaktifan via email pemilik toko.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs md:text-sm border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer flex items-center gap-2"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <Ban className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Ajukan Penonaktifan Toko</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Permintaan ini akan ditinjau oleh Administrator. Selama masih berstatus menunggu review, Anda dapat membatalkannya.
              </p>
            </div>

            <form onSubmit={handleRequestDeactivation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Penonaktifan Toko (Wajib)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Toko sedang renovasi sementara selama 1 bulan..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Minimal 5 karakter</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
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

export default StoreSettingsPage;
