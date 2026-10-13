import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Layers } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onValueChange: (val: string) => void;
  categories: string[];
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onValueChange,
  categories,
}) => {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        aria-label="Kategori Produk"
        className="inline-flex items-center justify-between gap-3 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs md:text-sm font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer min-w-[140px] md:min-w-[160px] transition-all"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Select.Value placeholder="Pilih Kategori" />
        </div>
        <Select.Icon className="text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={5}
          className="z-50 min-w-[180px] bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 animate-in fade-in-80 zoom-in-95"
        >
          <Select.Viewport className="p-1 space-y-0.5">
            {categories.map((cat) => (
              <Select.Item
                key={cat}
                value={cat}
                className="flex items-center justify-between px-3 py-2 text-xs md:text-sm font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors"
              >
                <Select.ItemText>{cat}</Select.ItemText>
                <Select.ItemIndicator className="text-orange-600">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};
