import React, { useState } from 'react';
import {
  Calculator,
  Package,
  History,
  X,
  Building2,
  Users,
  Store,
  Tags,
  ShieldCheck,
  KeyRound,
  Database,
  ChevronRight,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ActiveTab } from './TopNavbar.tsx';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { items, isMobileSidebarOpen, closeMobileSidebar } = useCart();
  const { user } = useAuth();
  const totalItemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    closeMobileSidebar();
  };

  const isDataActive = user?.role === 'ADMIN'
    ? (currentTab === 'admin-products' || currentTab === 'admin-categories')
    : (currentTab === 'products' || currentTab === 'categories');

  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);

  const isAuthActive = currentTab === 'cashiers' || currentTab === 'login-history' || currentTab === 'active-tokens';
  const canAccessAuth = user?.role === 'ADMIN' || user?.role === 'SHOP_OWNER' || user?.role === 'pemilik' || user?.role === 'MANAGER';
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);

  const navContent = (
    <nav className="flex-1 flex flex-col items-center gap-2.5 w-full px-1">
      {/* Active POS Cashier Button with badge (Only for non-ADMIN, role ADMIN cannot access order page) */}
      {user?.role !== 'ADMIN' ? (
        <button
          onClick={() => handleSelect('pos')}
          title="Kasir POS"
          className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
        >
          <div className="relative">
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shadow-md ${
                currentTab === 'pos'
                  ? 'bg-[#EC6C1A] text-white shadow-orange-600/30'
                  : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
              }`}
            >
              <Calculator className="w-5 h-5 md:w-5.5 md:h-5.5 stroke-[2]" />
            </div>
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#10B981] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-[#181A1F] shadow-xs">
                {totalItemCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] md:text-[11px] font-semibold tracking-tight mt-0.5 ${
              currentTab === 'pos' ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            Kasir
          </span>
        </button>
      ) : (
        /* ADMIN ONLY: Primary Tenants Management Tab */
        <button
          onClick={() => handleSelect('tenants')}
          title="Kelola Seluruh Tenan"
          className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'tenants' || currentTab === 'deactivation-requests'
                ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
                : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
            }`}
          >
            <Building2 className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </div>
          <span
            className={`text-[10px] md:text-[11px] font-medium tracking-tight mt-0.5 ${
              currentTab === 'tenants' || currentTab === 'deactivation-requests' ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            Tenan
          </span>
        </button>
      )}

      {/* Transaction History */}
      <button
        onClick={() => handleSelect('history')}
        title="Riwayat Transaksi"
        className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
      >
        <div
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'history'
              ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
              : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
          }`}
        >
          <History className="w-5 h-5 md:w-5.5 md:h-5.5" />
        </div>
        <span
          className={`text-[10px] md:text-[11px] font-medium tracking-tight mt-0.5 ${
            currentTab === 'history' ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          Riwayat
        </span>
      </button>

    {/* MANAGER / SHOP_OWNER ONLY: Toko Tab */}
      {(user?.role === 'SHOP_OWNER' || user?.role === 'pemilik' || user?.role === 'MANAGER') && (
        <button
          onClick={() => handleSelect('store-settings')}
          title="Pengaturan Toko & Akun Tenan"
          className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'store-settings'
                ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
                : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
            }`}
          >
            <Store className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </div>
          <span
            className={`text-[10px] md:text-[11px] font-medium tracking-tight mt-0.5 ${
              currentTab === 'store-settings' ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            Toko
          </span>
        </button>
      )}

      {/* Menu Data with Side Flyout Submenus: Produk & Kategori */}
      <DropdownMenu.Root open={isDataMenuOpen} onOpenChange={setIsDataMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title={user?.role === 'ADMIN' ? 'Menu Data (Produk & Kategori Tenan)' : 'Menu Data (Produk & Kategori)'}
            className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group outline-none"
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
                isDataActive
                  ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
                  : isDataMenuOpen
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
              }`}
            >
              <Database className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-0.5 w-full">
              <span
                className={`text-[10px] md:text-[11px] font-medium tracking-tight ${
                  isDataActive ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Data
              </span>
              <ChevronRight
                className={`w-2.5 h-2.5 transition-transform duration-200 ${
                  isDataMenuOpen ? 'text-orange-400 translate-x-0.5' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={14}
            className="z-50 min-w-48 bg-[#1B1D22] text-slate-100 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-150 focus:outline-none"
          >
            <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Data
              </span>
              <Database className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Submenu: Produk */}
              <DropdownMenu.Item
                onSelect={() => handleSelect(user?.role === 'ADMIN' ? 'admin-products' : 'products')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                  currentTab === 'products' || currentTab === 'admin-products'
                    ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentTab === 'products' || currentTab === 'admin-products'
                      ? 'bg-[#EC6C1A] text-white shadow-2xs'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">Produk</span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN' ? 'Semua Produk Tenan' : 'Katalog & Stok'}
                  </span>
                </div>
              </DropdownMenu.Item>

              {/* Submenu: Kategori */}
              <DropdownMenu.Item
                onSelect={() => handleSelect(user?.role === 'ADMIN' ? 'admin-categories' : 'categories')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                  currentTab === 'categories' || currentTab === 'admin-categories'
                    ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentTab === 'categories' || currentTab === 'admin-categories'
                      ? 'bg-[#EC6C1A] text-white shadow-2xs'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Tags className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">Kategori</span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN' ? 'Semua Kategori Tenan' : 'Kelola Kategori'}
                  </span>
                </div>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Menu Autentikasi with Side Flyout Submenus: Pengguna, Audit Login, Sesi Token */}
      {canAccessAuth && (
        <DropdownMenu.Root open={isAuthMenuOpen} onOpenChange={setIsAuthMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              title="Menu Autentikasi (Pengguna, Audit Login, Sesi Token)"
              className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group outline-none"
            >
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
                  isAuthActive
                    ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
                    : isAuthMenuOpen
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-5 h-5 md:w-5.5 md:h-5.5" />
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-0.5 w-full px-0.5">
                <span
                  className={`text-[9.5px] md:text-[10px] font-medium tracking-tight truncate ${
                    isAuthActive ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  Autentikasi
                </span>
                <ChevronRight
                  className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${
                    isAuthMenuOpen ? 'text-orange-400 translate-x-0.5' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="right"
              align="start"
              sideOffset={14}
              className="z-50 min-w-52 bg-[#1B1D22] text-slate-100 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-150 focus:outline-none"
            >
              <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Menu Autentikasi
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>

              <div className="flex flex-col gap-1">
                {/* Submenu: Pengguna (Hanya untuk Shop Owner / Manager) */}
                {user?.role !== 'ADMIN' && (
                  <DropdownMenu.Item
                    onSelect={() => handleSelect('cashiers')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                      currentTab === 'cashiers'
                        ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        currentTab === 'cashiers'
                          ? 'bg-[#EC6C1A] text-white shadow-2xs'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-tight">Pengguna</span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight">
                        Kelola Akun Kasir & Staf
                      </span>
                    </div>
                  </DropdownMenu.Item>
                )}

                {/* Submenu: Audit Login */}
                <DropdownMenu.Item
                  onSelect={() => handleSelect('login-history')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                    currentTab === 'login-history'
                      ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      currentTab === 'login-history'
                        ? 'bg-[#EC6C1A] text-white shadow-2xs'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">Audit Login</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {user?.role === 'ADMIN' ? 'Histori Login Seluruh Tenan' : 'Histori Login Staf'}
                    </span>
                  </div>
                </DropdownMenu.Item>

                {/* Submenu: Sesi Token */}
                <DropdownMenu.Item
                  onSelect={() => handleSelect('active-tokens')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                    currentTab === 'active-tokens'
                      ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      currentTab === 'active-tokens'
                        ? 'bg-[#EC6C1A] text-white shadow-2xs'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">Sesi Token</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {user?.role === 'ADMIN' ? 'Token Aktif Seluruh Tenan' : 'Token Aktif di Redis'}
                    </span>
                  </div>
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      
    </nav>
  );

  return (
    <>
      {/* Desktop Anchored Sidebar (hidden on mobile, visible on md+) */}
      <aside className="w-16 md:w-20 bg-[#181A1F] hidden md:flex flex-col items-center py-5 shrink-0 z-20 select-none shadow-md">
        {navContent}
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-40 md:hidden transition-opacity"
          />

          {/* Slide-out Sidebar on Mobile */}
          <aside className="fixed inset-y-0 left-0 z-50 w-24 bg-[#181A1F] flex flex-col items-center py-5 shadow-2xl md:hidden select-none animate-in slide-in-from-left duration-200">
            {/* Close Button */}
            <button
              onClick={closeMobileSidebar}
              title="Tutup Menu Sidebar"
              aria-label="Tutup Menu Sidebar"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center mb-4 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {navContent}
          </aside>
        </>
      )}
    </>
  );
};
