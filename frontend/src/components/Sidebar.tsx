import React from 'react';
import { Calculator, Package, History, PieChart, X } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
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
  const totalItemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    closeMobileSidebar();
  };

  const navContent = (
    <nav className="flex-1 flex flex-col items-center gap-2.5 w-full px-1">
      {/* Active POS Cashier Button with badge */}
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

      {/* Product Stock Inventory */}
      <button
        onClick={() => handleSelect('products')}
        title="Produk & Stok Warung"
        className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
      >
        <div
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'products'
              ? 'bg-[#EC6C1A] text-white shadow-orange-600/30'
              : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
          }`}
        >
          <Package className="w-5 h-5 md:w-5.5 md:h-5.5" />
        </div>
        <span
          className={`text-[10px] md:text-[11px] font-medium tracking-tight mt-0.5 ${
            currentTab === 'products' ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          Produk
        </span>
      </button>

      {/* Transaction History */}
      <button
        onClick={() => handleSelect('history')}
        title="Riwayat Transaksi"
        className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
      >
        <div
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'history'
              ? 'bg-[#EC6C1A] text-white shadow-orange-600/30'
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

      {/* Reports / Analytics */}
      <button
        onClick={() => handleSelect('reports')}
        title="Laporan Penjualan"
        className="w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer group"
      >
        <div
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'reports'
              ? 'bg-[#EC6C1A] text-white shadow-orange-600/30'
              : 'text-slate-400 group-hover:text-white group-hover:bg-white/5'
          }`}
        >
          <PieChart className="w-5 h-5 md:w-5.5 md:h-5.5" />
        </div>
        <span
          className={`text-[10px] md:text-[11px] font-medium tracking-tight mt-0.5 ${
            currentTab === 'reports' ? 'text-orange-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          Laporan
        </span>
      </button>
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
