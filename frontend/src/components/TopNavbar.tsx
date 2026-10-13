import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ShoppingCart,
  User as UserIcon,
  KeyRound,
  History,
  LogOut,
  Menu,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export type ActiveTab =
  | 'pos'
  | 'products'
  | 'history'
  | 'reports'
  | 'profile'
  | 'login-history'
  | 'change-password';

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
  const { logout } = useAuth();
  const totalItemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'profile':
        return 'Profil Pengguna';
      case 'login-history':
        return 'Histori Login';
      case 'change-password':
        return 'Ubah Password';
      case 'reports':
        return 'Laporan & Analitik';
      case 'products':
        return 'Katalog & Stok';
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
        {/* User Dropdown Menu using @radix-ui/react-dropdown-menu (Icon User Only, No Label) */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Menu Pengguna"
              title="Menu Pengguna"
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <UserIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[200px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 animate-in fade-in-80 zoom-in-95"
            >
              {/* Profil: membuka halaman profil */}
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('profile')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Profil</span>
              </DropdownMenu.Item>

              {/* Histori Login: membuka halaman histori login */}
              <DropdownMenu.Item
                onSelect={() => onNavigate?.('login-history')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 cursor-pointer outline-none transition-colors"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>Histori Login</span>
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

        {/* Shopping Cart Button for Tablet and Mobile (lg:hidden) */}
        <button
          onClick={onOpenMobileCart || openMobileCart}
          title="Buka Daftar Pesanan"
          className="relative flex items-center gap-2 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-xl shadow-xs font-bold text-xs md:text-sm transition-all cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5" />
            {totalItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-white shadow-xs">
                {totalItemCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline font-semibold">Pesanan</span>
          {totalItemCount > 0 && (
            <span className="hidden sm:inline text-[11px] bg-white/20 px-1.5 py-0.2 rounded-md font-mono">
              Rp{total.toLocaleString('id-ID')}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
