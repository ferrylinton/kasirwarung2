import React, { useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Store,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  RefreshCw,
  AtSign,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { LanguageSelector } from '../components/LanguageSelector.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { ADMIN, SHOP_OWNER, SHOP_CASHIER, UserRole } from '../constants/roles.ts';
import { CaptchaField } from '../components/CaptchaField.tsx';

const DEMO_ACCOUNTS: Array<{
  id: string;
  role: UserRole;
  label: string;
  email: string;
  password: string;
  subtext: string;
  badgeClass: string;
}> = [
  {
    id: 'admin',
    role: ADMIN,
    label: 'Super Administrator',
    email: 'admin@kasirwarung.id',
    password: 'admin123',
    subtext: 'Kelola seluruh tenan platform',
    badgeClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
  },
  {
    id: 'owner-budi',
    role: SHOP_OWNER,
    label: 'Budi Santoso (Pemilik Warung 1)',
    email: 'budi@kasirwarung.id',
    password: 'kasir123',
    subtext: 'Warung Berkah Budi',
    badgeClass: 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60',
  },
  {
    id: 'cashier-siti',
    role: SHOP_CASHIER,
    label: 'Siti Aminah (Kasir Warung 1)',
    email: 'siti@kasirwarung.id',
    password: 'kasir123',
    subtext: 'Warung Berkah Budi',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
  },
  {
    id: 'owner-hendra',
    role: SHOP_OWNER,
    label: 'Hendra Gunawan (Pemilik Warung 2)',
    email: 'hendra@kelontong.id',
    password: 'kasir123',
    subtext: 'Warung Kelontong Sejahtera',
    badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
  },
];

type AuthMode = 'login' | 'register_tenant' | 'reactivate_tenant';

interface LoginPageProps {
  onOpenPrivacyPolicy?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenPrivacyPolicy }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('budi@kasirwarung.id');
  const [loginPassword, setLoginPassword] = useState('kasir123');

  // Register Tenant form state
  const [shopName, setShopName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Reactivate Tenant form state
  const [reactivateEmail, setReactivateEmail] = useState('');

  // General Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantInactivePrompt, setTenantInactivePrompt] = useState<string | null>(null);

  // CAPTCHA Challenge State (uppercase letters & numbers, 5-minute validity, reloadable)
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaCode('');
    try {
      const res = await api.getCaptcha();
      if (res.success && res.data) {
        setCaptchaId(res.data.captchaId);
        setCaptchaSvg(res.data.imageSvg);
      }
    } catch {
      // Fallback
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // Refresh CAPTCHA challenge periodically (every 4.5 minutes) before 5-minute expiration
    const interval = setInterval(fetchCaptcha, 270 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Email simulation testing helper
  const [recentEmails, setRecentEmails] = useState<any[]>([]);

  const { login, registerTenant } = useAuth();

  // Load recent emails for testing confirmation links in preview
  const fetchRecentEmails = async () => {
    try {
      const res = await api.getRecentEmails();
      if (res.success && Array.isArray(res.data)) {
        setRecentEmails(res.data);
      }
    } catch {
      // Ignore background errors
    }
  };

  useEffect(() => {
    fetchRecentEmails();
    const interval = setInterval(fetchRecentEmails, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyTenant = async (token: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.verifyTenant(token);
      if (res.success) {
        setSuccessMsg(res.message);
        setMode('login');
        await fetchRecentEmails();
      }
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal');
    }
  };

  const handleConfirmReactivation = async (token: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.confirmReactivation(token);
      if (res.success) {
        setSuccessMsg(res.message);
        setMode('login');
        setTenantInactivePrompt(null);
        await fetchRecentEmails();
      }
    } catch (err: any) {
      setError(err.message || 'Konfirmasi pengaktifan kembali gagal');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setTenantInactivePrompt(null);

    if (!captchaCode.trim()) {
      setError(t('auth.captchaRequired', 'Kode captcha wajib diisi'));
      return;
    }

    setLoading(true);

    try {
      await login(loginEmail, loginPassword, captchaId, captchaCode);
    } catch (err: any) {
      const msg = err.message || t('auth.invalidCredentials', 'Email/Username atau password salah');
      setError(msg);
      if (err.tenantInactive || msg.toLowerCase().includes('dinonaktifkan') || msg.toLowerCase().includes('deactivated')) {
        setTenantInactivePrompt(loginEmail);
      }
      // Always reload captcha on failure
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!captchaCode.trim()) {
      setError(t('auth.captchaRequired', 'Kode captcha wajib diisi'));
      return;
    }

    setLoading(true);

    try {
      const res = await registerTenant({
        shopName,
        ownerEmail,
        username: ownerUsername,
        password: ownerPassword,
        captchaId,
        captchaCode,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        await fetchRecentEmails();
      }
      await fetchCaptcha();
    } catch (err: any) {
      setError(err.message || t('common.error', 'Gagal mendaftarkan warung baru'));
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!captchaCode.trim()) {
      setError(t('auth.captchaRequired', 'Kode captcha wajib diisi'));
      return;
    }

    setLoading(true);

    try {
      const res = await api.requestReactivation(reactivateEmail, captchaId, captchaCode);
      if (res.success) {
        setSuccessMsg(res.message);
        await fetchRecentEmails();
      }
      await fetchCaptcha();
    } catch (err: any) {
      setError(err.message || t('common.error', 'Gagal mengajukan pengaktifan kembali'));
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (emailVal: string, passVal: string) => {
    setLoginEmail(emailVal);
    setLoginPassword(passVal);
    setError(null);
    setTenantInactivePrompt(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-4 transition-colors">
      <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-xl border border-[var(--border-default)] dark:border-slate-800 p-6 md:p-8 space-y-6 text-[var(--text-primary)]">
        {/* Top bar with Language Selector & Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
            Kasir Warung POS
          </span>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" />
            <ThemeToggle variant="compact" />
          </div>
        </div>

        {/* Brand Lockup with KasirWarung Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-b from-orange-50/50 to-emerald-50/50 dark:from-orange-950/40 dark:to-emerald-950/40 border border-orange-200/60 dark:border-orange-500/30 rounded-2xl p-2 flex items-center justify-center mx-auto shadow-sm">
            <img
              src="/src/assets/images/kasir_warung_logo_1791830546088.jpg"
              alt="Logo KasirWarung"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal rounded-xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {t('auth.title', 'Kasir Warung')}
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
            {t('auth.subtitle', 'Sistem POS Kasir Modern untuk Warung & Toko Kelontong')}
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Warung Baru */}
        <div className="grid grid-cols-2 p-1 bg-[var(--bg-muted)] dark:bg-slate-800/80 rounded-2xl text-xs font-bold text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--bg-surface)] dark:bg-slate-900 text-[var(--text-primary)] shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('auth.loginTab', 'Masuk')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register_tenant');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register_tenant'
                ? 'bg-[var(--bg-surface)] dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('auth.registerTab', '+ Daftar Warung Baru')}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs p-3.5 rounded-2xl border border-red-500/30 font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {tenantInactivePrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setReactivateEmail(tenantInactivePrompt);
                    setMode('reactivate_tenant');
                    setError(null);
                  }}
                  className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 cursor-pointer block"
                >
                  {t('auth.requestReactivationLink', 'Minta Tautan Pengaktifan Warung Kembali →')}
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs p-3.5 rounded-2xl border border-emerald-500/30 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{successMsg}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {t('auth.checkInboxNotice', 'Silakan periksa kotak masuk email atau klik tautan verifikasi pada panel simulasi di bawah.')}
              </p>
            </div>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.emailOrUsername', 'Email atau Username')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder', 'budi@kasirwarung.id atau budi')}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  {t('auth.password', 'Kata Sandi (Password)')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reactivate_tenant');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                >
                  {t('auth.shopDeactivatedQuestion', 'Warung Dinonaktifkan?')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder', '••••••••')}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Captcha Field (uppercase letters + numbers, 5-minute validity, reloadable) */}
            <CaptchaField
              captchaId={captchaId}
              imageSvg={captchaSvg}
              captchaCode={captchaCode}
              onCodeChange={setCaptchaCode}
              onReload={fetchCaptcha}
              isLoading={captchaLoading}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || captchaLoading}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 active:scale-[0.99] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t('auth.loggingIn', 'Memproses Masuk...') : t('auth.loginButton', 'Masuk ke Sistem')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Accounts Select Dropdown using @radix-ui/react-select */}
            {(() => {
              const activeDemoAccount = DEMO_ACCOUNTS.find(
                (acc) => acc.email === loginEmail && acc.password === loginPassword
              );

              return (
                <div
                  className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 space-y-2 shadow-2xs transition-colors"
                  style={{ backgroundColor: 'var(--bg-subtle, #f8fafc)' }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      {t('auth.demoAccountsTitle', 'Akun Demo Siap Pakai:')}
                    </p>
                    <span className="text-[10px] text-[var(--text-subtle)] font-mono">Quick Access</span>
                  </div>

                  <Select.Root
                    value={activeDemoAccount?.id || ''}
                    onValueChange={(val) => {
                      const selected = DEMO_ACCOUNTS.find((acc) => acc.id === val);
                      if (selected) {
                        fillQuickDemo(selected.email, selected.password);
                      }
                    }}
                  >
                    <Select.Trigger
                      aria-label={t('auth.demoAccountsTitle', 'Pilih Akun Demo Cepat')}
                      className={`w-full h-11 px-3.5 rounded-xl text-xs md:text-sm text-[var(--text-primary)] flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer border ${
                        activeDemoAccount
                          ? 'bg-orange-50/70 dark:bg-orange-950/25 border-orange-300 dark:border-orange-800/60 ring-1 ring-orange-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                      }`}
                      style={{ backgroundColor: activeDemoAccount ? undefined : 'var(--bg-surface, #ffffff)' }}
                    >
                      <Select.Value placeholder="-- Pilih Akun Demo Cepat --">
                        {activeDemoAccount ? (
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${activeDemoAccount.badgeClass}`}
                            >
                              {activeDemoAccount.role}
                            </span>
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {activeDemoAccount.label}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-- Pilih Akun Demo Cepat --</span>
                        )}
                      </Select.Value>
                      <Select.Icon className="text-[var(--text-muted)] shrink-0">
                        <ChevronDown className="w-4 h-4" />
                      </Select.Icon>
                    </Select.Trigger>

                    <Select.Portal>
                      <Select.Content
                        position="popper"
                        sideOffset={6}
                        className="z-50 min-w-[280px] sm:min-w-[340px] bg-white dark:bg-[#131b2a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-1.5 animate-in fade-in-80 zoom-in-95 max-h-[320px] overflow-y-auto text-[var(--text-primary)]"
                        style={{ backgroundColor: 'var(--bg-dropdown, #ffffff)' }}
                      >
                        <Select.Viewport className="p-1 space-y-1">
                          {DEMO_ACCOUNTS.map((acc) => (
                            <Select.Item
                              key={acc.id}
                              value={acc.id}
                              className="relative flex items-center justify-between gap-3 px-3 py-2.5 text-xs rounded-xl cursor-pointer outline-none transition-colors select-none text-[var(--text-primary)] hover:bg-orange-50 dark:hover:bg-orange-950/40 focus:bg-orange-50 dark:focus:bg-orange-950/40 data-[highlighted]:bg-orange-50 dark:data-[highlighted]:bg-orange-950/40 data-[state=checked]:bg-orange-100/80 dark:data-[state=checked]:bg-orange-900/40 border border-transparent data-[state=checked]:border-orange-200 dark:data-[state=checked]:border-orange-800/60"
                            >
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${acc.badgeClass}`}
                                  >
                                    {acc.role}
                                  </span>
                                  <Select.ItemText>
                                    <span className="font-bold text-[var(--text-primary)] truncate">{acc.label}</span>
                                  </Select.ItemText>
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate">
                                  {acc.email} • {acc.subtext}
                                </span>
                              </div>
                              <Select.ItemIndicator className="text-orange-600 dark:text-orange-400 shrink-0 ml-2">
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              );
            })()}
          </form>
        )}

        {/* MODE 2: REGISTER TENANT */}
        {mode === 'register_tenant' && (
          <form onSubmit={handleRegisterTenantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.storeName', 'Nama Warung / Toko')}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t('auth.storeNamePlaceholder', 'Warung Berkah Jaya')}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.ownerEmail', 'Email Pemilik Warung')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder={t('auth.ownerEmailPlaceholder', 'pemilik@warung.id')}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.ownerUsername', 'Username Pemilik')}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={ownerUsername}
                  onChange={(e) => setOwnerUsername(e.target.value)}
                  placeholder={t('auth.ownerUsernamePlaceholder', 'budi')}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.ownerPassword', 'Kata Sandi (Password)')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Captcha Field (uppercase letters + numbers, 5-minute validity, reloadable) */}
            <CaptchaField
              captchaId={captchaId}
              imageSvg={captchaSvg}
              captchaCode={captchaCode}
              onCodeChange={setCaptchaCode}
              onReload={fetchCaptcha}
              isLoading={captchaLoading}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || captchaLoading}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t('auth.registering', 'Mendaftarkan...') : t('auth.registerButton', 'Daftarkan Warung & Kirim Verifikasi')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 3: REACTIVATE TENANT */}
        {mode === 'reactivate_tenant' && (
          <form onSubmit={handleReactivateSubmit} className="space-y-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-500" />
                {t('auth.reactivateHeading', 'Pengaktifan Kembali Toko')}
              </p>
              <p className="text-[11px] leading-relaxed text-blue-600 dark:text-blue-400">
                {t('auth.reactivateSubheading', 'Masukkan email pemilik toko yang terdaftar untuk menerima tautan pengaktifan kembali via email simulasi.')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {t('auth.ownerEmail', 'Email Pemilik Warung')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={reactivateEmail}
                  onChange={(e) => setReactivateEmail(e.target.value)}
                  placeholder="pemilik@warung.id"
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] dark:border-slate-800 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Captcha Field (uppercase letters + numbers, 5-minute validity, reloadable) */}
            <CaptchaField
              captchaId={captchaId}
              imageSvg={captchaSvg}
              captchaCode={captchaCode}
              onCodeChange={setCaptchaCode}
              onReload={fetchCaptcha}
              isLoading={captchaLoading}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || captchaLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t('auth.sending', 'Mengirim...') : t('auth.sendReactivationButton', 'Kirim Tautan Pengaktifan Kembali')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center cursor-pointer"
            >
              {t('auth.backToLogin', '← Kembali ke Halaman Masuk')}
            </button>
          </form>
        )}

        {/* Simulated Email Inbox for Testing in Preview */}
        {recentEmails.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                {t('auth.emailSimulatorHeading', 'Kotak Masuk Email Simulasi (Pratinjau)')}:
              </span>
              <button
                type="button"
                onClick={fetchRecentEmails}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {t('common.refresh', 'Segarkan')}
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {recentEmails.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[var(--bg-subtle)] dark:bg-slate-800/80 hover:bg-orange-500/10 rounded-xl border border-[var(--border-default)] dark:border-slate-800 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">
                      {item.type === 'verification' ? 'Konfirmasi Pendaftaran' : 'Pengaktifan Kembali'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] truncate">Penerima: {item.toEmail}</p>
                  {item.token && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.type === 'reactivation') {
                            handleConfirmReactivation(item.token);
                          } else {
                            handleVerifyTenant(item.token);
                          }
                        }}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t('auth.openVerificationLink', 'Buka Verifikasi')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info & Kebijakan Privasi */}
        <div className="pt-2 text-center border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span>&copy; {new Date().getFullYear()} Kasir Warung</span>
          <button
            type="button"
            onClick={() => {
              if (onOpenPrivacyPolicy) {
                onOpenPrivacyPolicy();
              } else if (typeof window !== 'undefined') {
                window.location.href = '/privacy-policy';
              }
            }}
            className="hover:text-orange-600 dark:hover:text-orange-400 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kebijakan Privasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
