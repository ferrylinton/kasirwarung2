import React from 'react';
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
        return 'Kelola Staf Kasir';
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
              {/* Header Info Pengguna */}
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || 'Kasir Warung'}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {user?.role === 'pemilik' ? 'Pemilik Toko' : 'Kasir'} • {user?.shift || 'Shift Aktif'}
                </p>
              </div>
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('profile')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Profil</span>
              </DropdownMenu.Item>

              {/* Role-Specific Admin & Shop Owner Menus */}
              {user?.role === 'ADMIN' && (
                <>
                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('tenants')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-purple-700 bg-purple-50/50 rounded-xl hover:bg-purple-100 focus:bg-purple-100 cursor-pointer outline-none transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Kelola Tenan Platform</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('admin-products')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-purple-700 rounded-xl hover:bg-purple-50 focus:bg-purple-50 cursor-pointer outline-none transition-colors"
                  >
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>Semua Produk Tenan</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('admin-categories')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-purple-700 rounded-xl hover:bg-purple-50 focus:bg-purple-50 cursor-pointer outline-none transition-colors"
                  >
                    <Tags className="w-4 h-4 text-purple-600" />
                    <span>Semua Kategori Tenan</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('deactivation-requests')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-purple-700 rounded-xl hover:bg-purple-50 focus:bg-purple-50 cursor-pointer outline-none transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>Histori Penonaktifan</span>
                  </DropdownMenu.Item>
                </>
              )}

              {(user?.role === 'SHOP_OWNER' || user?.role === 'pemilik') && (
                <>
                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('cashiers')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Kelola Kasir (SHOP_CASHIER)</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('categories')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
                  >
                    <Tags className="w-4 h-4 text-slate-400" />
                    <span>Kategori Produk</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => onNavigate?.('store-settings')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
                  >
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan Toko</span>
                  </DropdownMenu.Item>
                </>
              )}

              {/* Histori Login: membuka halaman histori login */}
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('login-history')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>Histori Login</span>
              </DropdownMenu.Item>

              {/* Sesi Access Token Aktif */}
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('active-tokens')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Sesi Token Aktif (Redis)</span>
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
                onSelect={() => logout()}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 focus:bg-red-50 cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Keluar</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        
      </div>
    </nav>
  );
};
