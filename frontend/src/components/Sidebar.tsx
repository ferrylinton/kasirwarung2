import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  ClipboardList,
  Terminal,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ActiveTab } from './TopNavbar.tsx';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout?: () => void;
}

interface SidebarNavItemsProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onItemSelect?: () => void;
}

/**
 * Hook to detect whether the current viewport is desktop (>= 768px).
 * Prevents mounting the desktop sidebar on mobile, avoiding duplicated Radix Dropdown portals.
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

/**
 * Isolated Navigation Items component with dedicated dropdown state.
 * Ensuring desktop and mobile instances (if transitioning) never share state.
 */
const SidebarNavItems: React.FC<SidebarNavItemsProps> = ({
  currentTab,
  onSelectTab,
  onItemSelect,
}) => {
  const { t } = useTranslation();
  const { items } = useCart();
  const { user } = useAuth();
  const totalItemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);

  const handleItemClick = (tab: ActiveTab) => {
    setIsHistoryMenuOpen(false);
    setIsDataMenuOpen(false);
    setIsAuthMenuOpen(false);
    onSelectTab(tab);
    onItemSelect?.();
  };

  const isDataActive =
    user?.role === 'ADMIN'
      ? currentTab === 'admin-products' || currentTab === 'admin-categories'
      : currentTab === 'products' || currentTab === 'categories';

  const isHistoryActive =
    currentTab === 'history' || currentTab === 'activity-log' || currentTab === 'system-logs';

  const isAuthActive =
    currentTab === 'cashiers' ||
    currentTab === 'login-history' ||
    currentTab === 'active-tokens';

  const canAccessAuth =
    user?.role === 'ADMIN' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik' ||
    user?.role === 'MANAGER';

  return (
    <nav className="flex-1 w-full flex flex-col items-center gap-2.5 px-2 overflow-y-auto overflow-x-hidden min-h-0 pt-1 pb-6 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25">
      {/* Active POS Cashier Button with badge (Only for non-ADMIN) */}
      {user?.role !== 'ADMIN' ? (
        <button
          onClick={() => handleItemClick('pos')}
          title={t('nav.pos', 'Pesanan')}
          className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group"
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
            className={`text-[11px] md:text-xs font-semibold tracking-tight mt-1 text-center leading-snug px-1 ${
              currentTab === 'pos'
                ? 'text-orange-400'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            {t('nav.pos', 'Pesanan')}
          </span>
        </button>
      ) : (
        /* ADMIN ONLY: Primary Tenants Management Tab */
        <button
          onClick={() => handleItemClick('tenants')}
          title={t('nav.tenants', 'Kelola Seluruh Tenan')}
          className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group"
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
            className={`text-[11px] md:text-xs font-semibold tracking-tight mt-1 text-center leading-snug px-1 ${
              currentTab === 'tenants' || currentTab === 'deactivation-requests'
                ? 'text-orange-400'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            {t('nav.tenants', 'Tenan')}
          </span>
        </button>
      )}

      {/* MANAGER / SHOP_OWNER ONLY: Toko Tab */}
      {(user?.role === 'SHOP_OWNER' ||
        user?.role === 'pemilik' ||
        user?.role === 'MANAGER') && (
        <button
          onClick={() => handleItemClick('store-settings')}
          title={t('nav.storeSettings', 'Pengaturan Toko & Akun Tenan')}
          className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group"
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
            className={`text-[11px] md:text-xs font-semibold tracking-tight mt-1 text-center leading-snug px-1 ${
              currentTab === 'store-settings'
                ? 'text-orange-400'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            {t('nav.storeSettings', 'Toko')}
          </span>
        </button>
      )}

      {/* Menu Histori with Flyout Submenus: Riwayat Transaksi & Aktivitas */}
      <DropdownMenu.Root
        open={isHistoryMenuOpen}
        onOpenChange={(open) => {
          setIsHistoryMenuOpen(open);
          if (open) {
            setIsDataMenuOpen(false);
            setIsAuthMenuOpen(false);
          }
        }}
      >
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title="Menu Histori (Riwayat Transaksi & Aktivitas)"
            className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group outline-none"
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
                isHistoryActive
                  ? 'bg-[#EC6C1A] text-white shadow-orange-600/30 shadow-md'
                  : isHistoryMenuOpen
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
              }`}
            >
              <History className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 w-full px-1">
              <span
                className={`text-[11px] md:text-xs font-semibold tracking-tight ${
                  isHistoryActive
                    ? 'text-orange-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Histori
              </span>
              <ChevronRight
                className={`w-3 h-3 transition-transform duration-200 ${
                  isHistoryMenuOpen
                    ? 'text-orange-400 translate-x-0.5'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={12}
            avoidCollisions={true}
            collisionPadding={12}
            className="z-50 min-w-52 max-w-[calc(100vw-7.5rem)] bg-[#1B1D22] text-slate-100 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-150 focus:outline-none"
          >
            <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Histori
              </span>
              <History className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Submenu: Riwayat Transaksi */}
              <DropdownMenu.Item
                onSelect={() => handleItemClick('history')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                  currentTab === 'history'
                    ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentTab === 'history'
                      ? 'bg-[#EC6C1A] text-white shadow-2xs'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <History className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">
                    {t('nav.history', 'Riwayat Transaksi')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN'
                      ? 'Penjualan Seluruh Tenan'
                      : 'Daftar Penjualan & Struk'}
                  </span>
                </div>
              </DropdownMenu.Item>

              {/* Submenu: Aktivitas */}
              <DropdownMenu.Item
                onSelect={() => handleItemClick('activity-log')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                  currentTab === 'activity-log'
                    ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentTab === 'activity-log'
                      ? 'bg-[#EC6C1A] text-white shadow-2xs'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">
                    {t('nav.activityLog', 'Aktivitas')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN'
                      ? 'Audit Trail Semua Tenan'
                      : 'Audit Trail Perubahan Toko'}
                  </span>
                </div>
              </DropdownMenu.Item>

              {/* Submenu: Log Sistem (Winston Async Daily Rotate File) */}
              <DropdownMenu.Item
                onSelect={() => handleItemClick('system-logs')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-all ${
                  currentTab === 'system-logs'
                    ? 'bg-orange-500/25 text-orange-200 border border-orange-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentTab === 'system-logs'
                      ? 'bg-[#EC6C1A] text-white shadow-2xs'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">
                    Log Sistem
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN'
                      ? 'Winston Log Semua Tenan'
                      : 'Winston Log Tenan Toko'}
                  </span>
                </div>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      

      {/* Menu Data with Flyout Submenus: Produk & Kategori */}
      <DropdownMenu.Root
        open={isDataMenuOpen}
        onOpenChange={(open) => {
          setIsDataMenuOpen(open);
          if (open) {
            setIsHistoryMenuOpen(false);
            setIsAuthMenuOpen(false);
          }
        }}
      >
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title={
              user?.role === 'ADMIN'
                ? 'Menu Data (Produk & Kategori Tenan)'
                : 'Menu Data (Produk & Kategori)'
            }
            className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group outline-none"
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
            <div className="flex items-center justify-center gap-1 mt-1 w-full px-1">
              <span
                className={`text-[11px] md:text-xs font-semibold tracking-tight ${
                  isDataActive
                    ? 'text-orange-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {t('nav.data', 'Data')}
              </span>
              <ChevronRight
                className={`w-3 h-3 transition-transform duration-200 ${
                  isDataMenuOpen
                    ? 'text-orange-400 translate-x-0.5'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={12}
            avoidCollisions={true}
            collisionPadding={12}
            className="z-50 min-w-48 max-w-[calc(100vw-7.5rem)] bg-[#1B1D22] text-slate-100 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-150 focus:outline-none"
          >
            <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('nav.menuData', 'Menu Data')}
              </span>
              <Database className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Submenu: Produk */}
              <DropdownMenu.Item
                onSelect={() =>
                  handleItemClick(
                    user?.role === 'ADMIN' ? 'admin-products' : 'products'
                  )
                }
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
                  <span className="text-xs font-bold leading-tight">
                    {t('nav.products', 'Produk')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN'
                      ? t('nav.adminProducts', 'Semua Produk Tenan')
                      : t('nav.products', 'Katalog & Stok')}
                  </span>
                </div>
              </DropdownMenu.Item>

              {/* Submenu: Kategori */}
              <DropdownMenu.Item
                onSelect={() =>
                  handleItemClick(
                    user?.role === 'ADMIN' ? 'admin-categories' : 'categories'
                  )
                }
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
                  <span className="text-xs font-bold leading-tight">
                    {t('nav.categories', 'Kategori')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {user?.role === 'ADMIN'
                      ? t('nav.adminCategories', 'Semua Kategori Tenan')
                      : t('nav.categories', 'Kelola Kategori')}
                  </span>
                </div>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Menu Autentikasi with Flyout Submenus */}
      {canAccessAuth && (
        <DropdownMenu.Root
          open={isAuthMenuOpen}
          onOpenChange={(open) => {
            setIsAuthMenuOpen(open);
            if (open) {
              setIsHistoryMenuOpen(false);
              setIsDataMenuOpen(false);
            }
          }}
        >
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              title="Menu Autentikasi (Pengguna, Audit Login, Sesi Token)"
              className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer group outline-none"
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
              <div className="flex items-center justify-center gap-1 mt-1 w-full px-1">
                <span
                  className={`text-[11px] md:text-xs font-semibold tracking-tight text-center leading-snug ${
                    isAuthActive
                      ? 'text-orange-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {t('nav.auth', 'Autentikasi')}
                </span>
                <ChevronRight
                  className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                    isAuthMenuOpen
                      ? 'text-orange-400 translate-x-0.5'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="right"
              align="start"
              sideOffset={12}
              avoidCollisions={true}
              collisionPadding={12}
              className="z-50 min-w-52 max-w-[calc(100vw-7.5rem)] bg-[#1B1D22] text-slate-100 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-150 focus:outline-none"
            >
              <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t('nav.menuAuth', 'Menu Autentikasi')}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>

              <div className="flex flex-col gap-1">
                {/* Submenu: Pengguna (Non-ADMIN only) */}
                {user?.role !== 'ADMIN' && (
                  <DropdownMenu.Item
                    onSelect={() => handleItemClick('cashiers')}
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
                      <span className="text-xs font-bold leading-tight">
                        {t('nav.cashiers', 'Pengguna')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight">
                        {t('nav.usersSub', 'Kelola Akun Kasir & Staf')}
                      </span>
                    </div>
                  </DropdownMenu.Item>
                )}

                {/* Submenu: Audit Login */}
                <DropdownMenu.Item
                  onSelect={() => handleItemClick('login-history')}
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
                    <span className="text-xs font-bold leading-tight">
                      {t('nav.auditLogin', 'Audit Login')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {user?.role === 'ADMIN'
                        ? t(
                            'nav.loginHistory',
                            'Histori Login Seluruh Tenan'
                          )
                        : t('nav.auditLoginSub', 'Histori Login Staf')}
                    </span>
                  </div>
                </DropdownMenu.Item>

                {/* Submenu: Sesi Token */}
                <DropdownMenu.Item
                  onSelect={() => handleItemClick('active-tokens')}
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
                    <span className="text-xs font-bold leading-tight">
                      {t('nav.activeTokens', 'Sesi Token')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {user?.role === 'ADMIN'
                        ? t(
                            'nav.activeTokens',
                            'Token Aktif Seluruh Tenan'
                          )
                        : t('nav.activeTokensSub', 'Token Aktif di Redis')}
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
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout: _onLogout,
}) => {
  const isDesktop = useIsDesktop();
  const { isMobileSidebarOpen, closeMobileSidebar } = useCart();

  const handleMobileSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    closeMobileSidebar();
  };

  return (
    <>
      {/* Desktop Anchored Sidebar - Rendered ONLY on desktop viewports (>= 768px) */}
      {isDesktop && (
        <aside className="w-28 lg:w-32 bg-[#181A1F] hidden md:flex flex-col items-center py-4 shrink-0 z-20 select-none shadow-md h-full overflow-hidden">
          <SidebarNavItems
            currentTab={currentTab}
            onSelectTab={onSelectTab}
          />
        </aside>
      )}

      {/* Mobile Drawer Sidebar Overlay - Rendered ONLY on mobile when open */}
      {!isDesktop && isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-40 md:hidden transition-opacity"
          />

          {/* Slide-out Sidebar on Mobile */}
          <aside className="fixed inset-y-0 left-0 z-50 w-28 sm:w-32 bg-[#181A1F] flex flex-col items-center py-4 shadow-2xl md:hidden select-none animate-in slide-in-from-left duration-200 h-full overflow-hidden">
            {/* Close Button pinned at top */}
            <div className="shrink-0 mb-3">
              <button
                onClick={closeMobileSidebar}
                title="Tutup Menu Sidebar"
                aria-label="Tutup Menu Sidebar"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SidebarNavItems
              currentTab={currentTab}
              onSelectTab={handleMobileSelect}
              onItemSelect={closeMobileSidebar}
            />
          </aside>
        </>
      )}
    </>
  );
};
