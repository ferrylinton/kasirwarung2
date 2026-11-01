import React from 'react';
import { Search } from 'lucide-react';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSwitchCashier?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="flex items-center justify-between gap-3 pb-4">
      {/* Search Pill */}
      <div className="flex-1 max-w-md w-full">
        <div className="relative flex items-center bg-[var(--bg-surface)] rounded-full border border-[var(--border-default)] shadow-2xs hover:border-[var(--border-strong)] focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all px-4 py-1.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kata kunci"
            className="w-full bg-transparent text-xs md:text-sm text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none"
          />
          <button
            type="button"
            className="w-7 h-7 bg-[var(--bg-muted)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors cursor-pointer"
            title="Cari Produk"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </header>
  );
};
