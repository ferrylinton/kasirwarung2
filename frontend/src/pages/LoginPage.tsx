import React, { useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import {
  ShoppingBag,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Building2,
  Store,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AtSign,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

const DEMO_ACCOUNTS = [
  {
    id: 'admin',
    role: 'ADMIN',
    label: 'Super Administrator',
    email: 'admin@kasirwarung.id',
    password: 'admin123',
    subtext: 'Kelola seluruh tenan platform',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'owner-budi',
    role: 'SHOP_OWNER',
    label: 'Budi Santoso (Pemilik Warung 1)',
    email: 'budi@kasirwarung.id',
    password: 'kasir123',
    subtext: 'Warung Berkah Budi',
    badgeClass: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'cashier-siti',
    role: 'SHOP_CASHIER',
    label: 'Siti Aminah (Kasir Warung 1)',
    email: 'siti@kasirwarung.id',
    password: 'kasir123',
    subtext: 'Warung Berkah Budi',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'owner-hendra',
    role: 'SHOP_OWNER',
    label: 'Hendra Gunawan (Pemilik Warung 2)',
    email: 'hendra@kelontong.id',
    password: 'kasir123',
    subtext: 'Warung Kelontong Sejahtera',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
];

type AuthMode = 'login' | 'register_tenant' | 'reactivate_tenant';

export const LoginPage: React.FC = () => {
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
      // Ignored
    }
  };

  useEffect(() => {
    fetchRecentEmails();

    // Check URL parameters for confirmation / verification links
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const path = window.location.pathname;

    if (token) {
      if (path.includes('reactivate') || params.get('action') === 'reactivate') {
        handleConfirmReactivation(token);
      } else {
        handleVerifyTenant(token);
      }
    }
  }, []);

  const handleVerifyTenant = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyTenant(token);
      if (res.success) {
        setSuccessMsg(res.message);
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi pendaftaran warung');
    } finally {
      setLoading(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleConfirmReactivation = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.confirmReactivation(token);
      if (res.success) {
        setSuccessMsg(res.message);
        setTenantInactivePrompt(null);
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengaktifkan kembali warung');
    } finally {
      setLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setTenantInactivePrompt(null);
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      const msg = err.message || 'Gagal autentikasi';
      setError(msg);
      if (err.tenantInactive || msg.toLowerCase().includes('dinonaktifkan')) {
        setTenantInactivePrompt(loginEmail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await registerTenant({
        shopName,
        ownerEmail,
        username: ownerUsername,
        password: ownerPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        await fetchRecentEmails();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan warung baru');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.requestReactivation(reactivateEmail);
      if (res.success) {
        setSuccessMsg(res.message);
        await fetchRecentEmails();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan pengaktifan kembali');
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
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-200/80 p-6 md:p-8 space-y-6">
        {/* Brand Lockup with KasirWarung Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-b from-orange-50/50 to-emerald-50/50 border border-orange-100 rounded-2xl p-2 flex items-center justify-center mx-auto shadow-sm">
            <img
              src="/src/assets/images/kasir_warung_logo_1791830546088.jpg"
              alt="Logo KasirWarung"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kasir Warung
          </h2>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Warung Baru */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
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
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            + Daftar Warung Baru
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-2xl border border-red-200 font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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
                  className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-800 cursor-pointer block"
                >
                  Minta Tautan Pengaktifan Warung Kembali →
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-2xl border border-emerald-200 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{successMsg}</p>
              <p className="text-[11px] text-emerald-700">
                Silakan periksa kotak masuk email atau klik tautan verifikasi pada panel simulasi di bawah.
              </p>
            </div>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email atau Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="budi@kasirwarung.id atau budi"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reactivate_tenant');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-orange-600 hover:underline cursor-pointer"
                >
                  Warung Dinonaktifkan?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password akun"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>{loading ? 'Memproses Masuk...' : 'Masuk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Accounts Select Dropdown using @radix-ui/react-select */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  Pilih Akun Demo Cepat:
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Pilih Pengguna</span>
              </div>

              <Select.Root
                value={
                  DEMO_ACCOUNTS.find(
                    (acc) => acc.email === loginEmail && acc.password === loginPassword
                  )?.id || ''
                }
                onValueChange={(val) => {
                  const selected = DEMO_ACCOUNTS.find((acc) => acc.id === val);
                  if (selected) {
                    fillQuickDemo(selected.email, selected.password);
                  }
                }}
              >
                <Select.Trigger
                  aria-label="Pilih Akun Demo Cepat"
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
                >
                  <Select.Value placeholder="-- Pilih Akun Demo Cepat --" />
                  <Select.Icon className="text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={6}
                    className="z-50 min-w-[280px] sm:min-w-[340px] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 animate-in fade-in-80 zoom-in-95 max-h-[300px] overflow-y-auto"
                  >
                    <Select.Viewport className="p-1 space-y-1">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <Select.Item
                          key={acc.id}
                          value={acc.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-xs rounded-xl hover:bg-orange-50 hover:text-orange-950 focus:bg-orange-50 focus:text-orange-950 cursor-pointer outline-none transition-colors data-[highlighted]:bg-orange-50 data-[state=checked]:bg-orange-50/70"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${acc.badgeClass}`}
                              >
                                {acc.role}
                              </span>
                              <Select.ItemText>
                                <span className="font-bold text-slate-800">{acc.label}</span>
                              </Select.ItemText>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {acc.email} • {acc.subtext}
                            </span>
                          </div>
                          <Select.ItemIndicator className="text-orange-600 shrink-0">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </form>
        )}

        {/* MODE 2: REGISTER TENANT */}
        {mode === 'register_tenant' && (
          <form onSubmit={handleRegisterTenantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Warung
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Contoh: Warung Berkah Jaya"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Pemilik Warung
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="pemilik@warungberkah.id"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Link konfirmasi aktivasi warung akan dikirim ke alamat email ini.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Pemilik Warung
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={ownerUsername}
                  onChange={(e) => setOwnerUsername(e.target.value)}
                  placeholder="pemilik_berkah"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Pemilik Warung
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>{loading ? 'Mendaftarkan Warung...' : 'Daftarkan Warung Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 3: REACTIVATE TENANT */}
        {mode === 'reactivate_tenant' && (
          <form onSubmit={handleReactivateSubmit} className="space-y-4">
            <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                Pengaktifan Kembali Warung (Tenan)
              </p>
              <p className="text-[11px] leading-relaxed text-blue-700">
                Masukkan alamat email pemilik warung yang terdaftar. Sistem akan mengirimkan tautan konfirmasi untuk mengaktifkan kembali akun warung Anda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Pemilik Warung
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={reactivateEmail}
                  onChange={(e) => setReactivateEmail(e.target.value)}
                  placeholder="pemilik@warung.id"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>{loading ? 'Mengirim Tautan...' : 'Kirim Tautan Pengaktifan Kembali'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-800 text-center cursor-pointer"
            >
              ← Kembali ke Halaman Masuk
            </button>
          </form>
        )}

        {/* Simulated Email Inbox for Testing in Preview */}
        {recentEmails.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                Email Simulasi Terakhir (Testing Preview):
              </span>
              <button
                type="button"
                onClick={fetchRecentEmails}
                className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Segarkan
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {recentEmails.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 hover:bg-orange-50/50 rounded-xl border border-slate-200/80 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {item.type === 'verification' ? 'Konfirmasi Pendaftaran' : 'Pengaktifan Kembali'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate">Penerima: {item.toEmail}</p>
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
                        <span>Klik Konfirmasi ({item.type === 'reactivation' ? 'Aktifkan' : 'Verifikasi'})</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
