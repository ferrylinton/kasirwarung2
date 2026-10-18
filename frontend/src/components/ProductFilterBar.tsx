import React from 'react';
import * as Select from '@radix-ui/react-select';
import { Search, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Category } from '../services/api.ts';

const DEFAULT_CATEGORIES = [
  'Semua Produk',
  'Makanan Instan',
  'Minuman',
  'Sembako',
  'Camilan',
  'Kebutuhan Rumah',
];

export interface ProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: (Category | string)[];
  placeholder?: string;
  className?: string;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories = [],
  placeholder = 'Cari berdasarkan nama produk atau SKU...',
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-3.5 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/50 text-slate-900 placeholder-slate-400 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Select Filter */}
      <div className="flex items-center gap-2">
        <Select.Root value={selectedCategory} onValueChange={(val) => onCategoryChange(val)}>
          <Select.Trigger
            aria-label="Filter Kategori"
            className="inline-flex items-center justify-between gap-2 px-3.5 py-2 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer w-full md:w-auto min-w-[140px] md:min-w-[170px] transition-all"
          >
            <Select.Value placeholder="Semua Produk" />
            <Select.Icon className="text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={5}
              className="overflow-hidden bg-white rounded-xl shadow-xl border border-slate-200 z-50 min-w-[180px] p-1.5 animate-in fade-in-80"
            >
              <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-slate-600 cursor-default">
                <ChevronUp className="w-4 h-4" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                <Select.Item
                  value="Semua Produk"
                  className="relative flex items-center justify-between px-3 py-2 text-xs md:text-sm rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 focus:outline-none cursor-pointer select-none font-medium data-[state=checked]:font-bold data-[state=checked]:text-orange-600 data-[state=checked]:bg-orange-50/70"
                >
                  <Select.ItemText>Semua Produk</Select.ItemText>
                  <Select.ItemIndicator className="text-orange-600 ml-2">
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
                </Select.Item>

                {categories.length > 0 ? (
                  categories
                    .filter((cat) => (typeof cat === 'string' ? cat !== 'Semua Produk' : cat.name !== 'Semua Produk'))
                    .map((cat) => {
                      const name = typeof cat === 'string' ? cat : cat.name;
                      const icon = typeof cat === 'string' ? '' : cat.icon;
                      const key = typeof cat === 'string' ? cat : (cat.id || cat.name);
                      return (
                        <Select.Item
                          key={key}
                          value={name}
                          className="relative flex items-center justify-between px-3 py-2 text-xs md:text-sm rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 focus:outline-none cursor-pointer select-none font-medium data-[state=checked]:font-bold data-[state=checked]:text-orange-600 data-[state=checked]:bg-orange-50/70"
                        >
                          <Select.ItemText>
                            {icon ? `${icon} ` : ''}{name}
                          </Select.ItemText>
                          <Select.ItemIndicator className="text-orange-600 ml-2">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      );
                    })
                ) : (
                  DEFAULT_CATEGORIES.filter((c) => c !== 'Semua Produk').map((cat) => (
                    <Select.Item
                      key={cat}
                      value={cat}
                      className="relative flex items-center justify-between px-3 py-2 text-xs md:text-sm rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 focus:outline-none cursor-pointer select-none font-medium data-[state=checked]:font-bold data-[state=checked]:text-orange-600 data-[state=checked]:bg-orange-50/70"
                    >
                      <Select.ItemText>{cat}</Select.ItemText>
                      <Select.ItemIndicator className="text-orange-600 ml-2">
                        <Check className="w-4 h-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))
                )}
              </Select.Viewport>
              <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-slate-600 cursor-default">
                <ChevronDown className="w-4 h-4" />
              </Select.ScrollDownButton>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  );
};

export default ProductFilterBar;
