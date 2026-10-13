import React from 'react';
import { Search, User as UserIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSwitchCashier: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSwitchCashier,
}) => {
  const { user } = useAuth();

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4">
      {/* Search Pill */}
      <div className="flex-1 max-w-md w-full">
        <div className="relative flex items-center bg-white rounded-full border border-slate-200/90 shadow-2xs hover:border-slate-300 focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all px-4 py-1.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kata kunci"
            className="w-full bg-transparent text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors cursor-pointer"
            title="Cari Produk"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* User Profile Pill */}
      <div className="flex items-center justify-end">
        <button
          onClick={onOpenSwitchCashier}
          title="Profil Kasir / Ganti Shift"
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full shadow-2xs text-xs md:text-sm font-medium text-slate-700 transition-all cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800">
            {user ? user.name : 'Budi Santoso'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform" />
        </button>
      </div>
    </header>
  );
};
