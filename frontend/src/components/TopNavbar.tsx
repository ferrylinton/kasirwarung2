import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User as UserIcon,
  KeyRound,
  History,
  LogOut,
  Menu,
  ChevronDown,
  Building2,
  Users,
  Store,
  Tags,
  Package,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { ADMIN } from '../constants/roles.ts';

export type ActiveTab =
  | 'pos'
  | 'products'
  | 'categories'
  | 'history'
  | 'profile'
  | 'login-history'
  | 'active-tokens'
  | 'activity-log'
  | 'system-logs'
  | 'change-password'
  | 'tenants'
  | 'admin-products'
  | 'admin-categories'
  | 'deactivation-requests'
  | 'cashiers'
  | 'store-settings'
  | 'privacy-policy'
  | 'not-found'
  | 'error';

interface TopNavbarProps {
  currentTab?: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenMobileCart?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab = 'pos',
  onNavigate,
  onOpenMobileCart,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, total, openMobileCart, toggleMobileSidebar } = useCart();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const totalItemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleNav = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      navigate(tab === 'pos' ? '/' : `/${tab}`);
    }
  };

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'tenants':
        return t('nav.tenants', 'Kelola Tenan Platform');
      case 'admin-products':
        return t('nav.adminProducts', 'Semua Produk Tenan');
      case 'admin-categories':
        return t('nav.adminCategories', 'Semua Kategori Tenan');
      case 'deactivation-requests':
        return t('nav.deactivationRequests', 'Histori Penonaktifan Toko');
      case 'cashiers':
        return t('nav.cashiers', 'Kelola Pengguna');
      case 'store-settings':
        return t('nav.storeSettings', 'Pengaturan Toko');
      case 'profile':
        return t('nav.profile', 'Profil Pengguna');
      case 'login-history':
        return user?.role === ADMIN
          ? t('nav.loginHistory', 'Histori Login Seluruh Tenan')
          : t('nav.loginHistory', 'Histori Login Pengguna Toko');
      case 'active-tokens':
        return user?.role === ADMIN
          ? t('nav.activeTokens', 'Access Token Aktif (Semua Tenan)')
          : t('nav.activeTokens', 'Access Token Aktif Toko');
      case 'activity-log':
        return user?.role === ADMIN
          ? t('nav.activityLog', 'Log Aktivitas (Semua Toko)')
          : t('nav.activityLog', 'Log Aktivitas Toko');
      case 'system-logs':
        return user?.role === ADMIN
          ? 'Log Sistem (Semua Tenan - Winston)'
          : 'Log Sistem (Tenan Toko - Winston)';

      case 'change-password':
        return t('nav.changePassword', 'Ubah Password');
      case 'products':
        return t('nav.products', 'Katalog & Stok');
      case 'categories':
        return t('nav.categories', 'Kelola Kategori Produk');
      case 'history':
        return t('nav.history', 'Riwayat Transaksi');
      case 'not-found':
        return '404 · Halaman Tidak Ditemukan';
      case 'error':
        return '500 · Terjadi Kesalahan Sistem';
      case 'pos':
      default:
        return t('nav.pos', 'Pesanan');
    }
  };

  return (
    <nav className="w-full bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xs z-30 select-none transition-colors">
      {/* Left: Mobile Hamburger Menu & Judul Halaman Saja */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Hamburger Menu to toggle Sidebar */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label={t('common.actions', 'Menu')}
          title={t('common.actions', 'Menu')}
          className="md:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {getSectionTitle()}
        </h2>
      </div>

      {/* Right: Language Selector, Theme Toggle, Shopping Cart, and User Dropdown Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle variant="compact" />

        {/* Language Selector using Radix UI Select */}
        <LanguageSelector variant="compact" />

        {/* Shopping Cart Button for Tablet and Mobile (non-ADMIN only) */}
        {user?.role !== ADMIN && (
          <button
            onClick={onOpenMobileCart || openMobileCart}
            title={t('pos.cartTitle', 'Keranjang')}
            className="relative h-9 md:h-10 px-2.5 sm:px-3.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-full shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-[#16A34A] shadow-xs">
                  {totalItemCount}
                </span>
              )}
            </div>
            {totalItemCount > 0 ? (
              <span className="hidden sm:inline font-semibold text-xs md:text-sm tabular-nums">
                Rp{total.toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="hidden sm:inline font-semibold text-xs md:text-sm">
                {t('nav.pos', 'Pesanan')}
              </span>
            )}
          </button>
        )}

        {/* User Dropdown Menu using @radix-ui/react-dropdown-menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={t('profile.title', 'Menu Pengguna')}
              title={`${t('profile.title', 'Menu Pengguna')}: ${user?.name || 'Kasir'}`}
              className="h-9 md:h-10 px-2.5 sm:px-3 rounded-full bg-slate-100 hover:bg-orange-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20 group"
            >
              <div className="text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </div>
              <span className="hidden sm:inline font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 max-w-[150px] truncate">
                {user?.name || 'Kasir'}
              </span>
              <ChevronDown className="hidden sm:inline w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors shrink-0" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[210px] bg-[var(--bg-surface-elevated)] rounded-2xl shadow-xl border border-[var(--border-default)] p-1.5 animate-in fade-in-80 zoom-in-95 text-[var(--text-primary)]"
            >
              <DropdownMenu.Item
                onSelect={() => handleNav('profile')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 focus:bg-orange-50 dark:focus:bg-orange-950/40 cursor-pointer outline-none transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>{t('nav.profile', 'Profil')}</span>
              </DropdownMenu.Item>

              {/* Ubah password */}
              <DropdownMenu.Item
                onSelect={() => handleNav('change-password')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 focus:bg-orange-50 dark:focus:bg-orange-950/40 cursor-pointer outline-none transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>{t('nav.changePassword', 'Ubah Password')}</span>
              </DropdownMenu.Item>

              {/* Kebijakan Privasi */}
              <DropdownMenu.Item
                onSelect={() => handleNav('privacy-policy')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 focus:bg-orange-50 dark:focus:bg-orange-950/40 cursor-pointer outline-none transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>{t('nav.privacyPolicy', 'Kebijakan Privasi')}</span>
              </DropdownMenu.Item>

              {/* Separator */}
              <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

              {/* Keluar */}
              <DropdownMenu.Item
                onSelect={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>{t('nav.logout', 'Keluar')}</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-[var(--bg-surface)] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-[var(--border-default)] p-6 animate-in zoom-in-95 duration-150 space-y-4 text-center text-[var(--text-primary)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-2xs">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 id="logout-confirm-title" className="text-base md:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {t('nav.logout', 'Konfirmasi Keluar')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('common.confirm', 'Apakah Anda yakin ingin keluar dari akun')} <strong className="text-slate-800 dark:text-slate-200">{user?.name || 'Pengguna'}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs md:text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Batal')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs md:text-sm font-bold shadow-md shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout', 'Ya, Keluar')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
