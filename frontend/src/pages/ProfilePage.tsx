import React from 'react';
import {
  User,
  Shield,
  Clock,
  CheckCircle,
  ArrowLeft,
  KeyRound,
  History,
  Store,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';

interface ProfilePageProps {
  onBackToPos: () => void;
  onNavigateToChangePassword: () => void;
  onNavigateToLoginHistory: () => void;
  onOpenSwitchShift: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToPos,
  onNavigateToChangePassword,
  onNavigateToLoginHistory,
  onOpenSwitchShift,
  onNavigate,
}) => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar
        currentTab="profile"
        onNavigate={onNavigate}
        onOpenShiftModal={onOpenSwitchShift}
      />
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

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Kasir Warung · Manajemen Akun
          </span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Informasi akun kasir yang sedang aktif dan pengaturan sesi operasional.
          </p>
        </div>

        {/* Main Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Avatar & Identity Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name || 'Budi Santoso'}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {user?.email || 'budi@kasirwarung.id'}
              </p>
            </div>

            <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200/60">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Aktif & Terverifikasi</span>
              </span>
            </div>

            <div className="w-full pt-4 space-y-2">
              <button
                onClick={onNavigateToChangePassword}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Ubah Password</span>
              </button>

              <button
                onClick={onNavigateToLoginHistory}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>Lihat Histori Login</span>
              </button>
            </div>
          </div>

          {/* Right: Detailed Information */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Informasi Shift & Akses
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-orange-500" />
                    Peran Kasir / Akses
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 uppercase">
                    {user?.role || 'KASIR'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Shift Operasional
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {user?.shift || 'Shift Siang (08:00 - 16:00)'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-orange-500" />
                    Unit Toko / Warung
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {user?.tenantName || (user?.role === 'ADMIN' ? 'Platform Administrator' : 'Kasir Warung')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    ID Pengguna (ObjectId)
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-700 truncate">
                    {user?.id || 'USR-2026-BUDI'}
                  </p>
                </div>
              </div>

              {/* Quick links for Shop Owner or Admin */}
              {(user?.role === 'SHOP_OWNER' || user?.role === 'pemilik') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onNavigate?.('cashiers')}
                    className="p-3.5 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/80 rounded-2xl text-left transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-orange-900 group-hover:text-orange-700">
                      Kelola Staf Kasir (SHOP_CASHIER) →
                    </p>
                    <p className="text-[11px] text-orange-700 mt-0.5">
                      Tambah, ubah data shift, atau hapus akses kasir toko Anda.
                    </p>
                  </button>

                  <button
                    onClick={() => onNavigate?.('store-settings')}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">
                      Pengaturan Toko & Penonaktifan →
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lihat status tenan dan ajukan penonaktifan akun toko.
                    </p>
                  </button>
                </div>
              )}

              {user?.role === 'ADMIN' && (
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate?.('tenants')}
                    className="w-full p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-purple-900 group-hover:text-purple-700">
                      Kelola Seluruh Tenan Toko (ADMIN) →
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Kontrol status aktif/nonaktif dan review permintaan penonaktifan dari pemilik toko.
                    </p>
                  </button>
                </div>
              )}

              {/* Action Banner to Switch Shift */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-orange-50/60 p-4 rounded-2xl border border-orange-200/60">
                <div>
                  <h4 className="text-xs font-bold text-orange-950">Ganti Shift Kasir?</h4>
                  <p className="text-[11px] text-orange-700 mt-0.5">
                    Serah terima kasir dengan Siti Aminah atau akun kasir lainnya.
                  </p>
                </div>
                <button
                  onClick={onOpenSwitchShift}
                  className="px-4 py-2 bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Ganti Shift Kasir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProfilePage;
