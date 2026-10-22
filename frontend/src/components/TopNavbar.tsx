import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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

export type ActiveTab =
  | 'pos'
  | 'products'
  | 'categories'
  | 'history'
  | 'profile'
  | 'login-history'
  | 'active-tokens'
  | 'change-password'
  | 'tenants'
  | 'admin-products'
  | 'admin-categories'
  | 'deactivation-requests'
  | 'cashiers'
  | 'store-settings';

interface TopNavbarProps {
  currentTab?: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenMobileCart?: () => void;
  onOpenShiftModal?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab = 'pos',
  onNavigate,
  onOpenMobileCart,
}) => {
  const { items, total, openMobileCart, toggleMobileSidebar } = useCart();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const totalItemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'tenants':
        return 'Kelola Tenan Platform';
      case 'admin-products':
        return 'Semua Produk Tenan';
      case 'admin-categories':
        return 'Semua Kategori Tenan';
      case 'deactivation-requests':
        return 'Histori Penonaktifan Toko';
      case 'cashiers':
        return 'Kelola Pengguna';
      case 'store-settings':
        return 'Pengaturan Toko';
      case 'profile':
        return 'Profil Pengguna';
      case 'login-history':
        return user?.role === 'ADMIN' ? 'Histori Login Seluruh Tenan' : 'Histori Login Pengguna Toko';
      case 'active-tokens':
        return user?.role === 'ADMIN' ? 'Access Token Aktif (Semua Tenan)' : 'Access Token Aktif Toko';
      case 'change-password':
        return 'Ubah Password';
      case 'products':
        return 'Katalog & Stok';
      case 'categories':
        return 'Kelola Kategori Produk';
      case 'history':
        return 'Riwayat Transaksi';
      case 'pos':
      default:
        return 'Kasir POS';
    }
  };

  return (
    <nav className="w-full bg-white border-b border-slate-200/90 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xs z-30 select-none">
      {/* Left: Mobile Hamburger Menu & Judul Halaman Saja */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Hamburger Menu to toggle Sidebar */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Buka Menu Sidebar"
          title="Buka Menu Sidebar"
          className="md:hidden w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-50 active:scale-95 text-slate-700 hover:text-orange-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
          {getSectionTitle()}
        </h2>
      </div>

      {/* Right: User Dropdown Menu & Tablet/Mobile Shopping Cart Button */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Shopping Cart Button for Tablet and Mobile (non-ADMIN only) */}
        {user?.role !== 'ADMIN' && (
          <button
            onClick={onOpenMobileCart || openMobileCart}
            title="Buka Daftar Pesanan"
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
                Pesanan
              </span>
            )}
          </button>
        )}

        {/* User Dropdown Menu using @radix-ui/react-dropdown-menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Menu Pengguna"
              title={`Menu Pengguna: ${user?.name || 'Kasir'}`}
              className="h-9 md:h-10 px-2.5 sm:px-3 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20 group"
            >
              <div className="text-orange-600 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </div>
              <span className="hidden sm:inline font-semibold text-xs md:text-sm text-slate-800 group-hover:text-orange-600 max-w-[150px] truncate">
                {user?.name || 'Kasir'}
              </span>
              <ChevronDown className="hidden sm:inline w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[210px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 animate-in fade-in-80 zoom-in-95"
            >
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('profile')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Profil</span>
              </DropdownMenu.Item>

              {/* Ubah password: membuka halaman ubah password */}
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('change-password')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Ubah password</span>
              </DropdownMenu.Item>

              {/* Seperator di atas logout */}
              <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

              {/* Keluar */}
              <DropdownMenu.Item
                onSelect={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 focus:bg-red-50 cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Keluar</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200/80 p-6 animate-in zoom-in-95 duration-150 space-y-4 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 id="logout-confirm-title" className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun <strong className="text-slate-800">{user?.name || 'Pengguna'}</strong>? Sesi aktif Anda akan diakhiri.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold transition-colors cursor-pointer"
              >
                Batal
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
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
