import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check, Building2 } from 'lucide-react';
import { Tenant } from '../services/api.ts';

export interface TenantSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  tenants: Tenant[];
  className?: string;
  placeholder?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

export const TenantSelect: React.FC<TenantSelectProps> = ({
  value,
  onValueChange,
  tenants,
  className = '',
  placeholder = 'Pilih Tenan',
  includeAllOption = true,
  allOptionLabel,
}) => {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        aria-label="Pilih Tenan"
        className={`inline-flex items-center justify-between gap-2.5 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)] rounded-xl text-xs md:text-sm font-semibold text-[var(--text-primary)] shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer min-w-[170px] md:min-w-[200px] transition-all ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <Select.Value placeholder={placeholder} />
        </div>
        <Select.Icon className="text-[var(--text-muted)] shrink-0">
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={5}
          className="z-50 min-w-[210px] max-h-[300px] bg-[var(--bg-dropdown)] rounded-xl shadow-lg border border-[var(--border-default)] p-1.5 animate-in fade-in-80 zoom-in-95 text-[var(--text-primary)]"
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-6 text-[var(--text-muted)] cursor-default">
            <ChevronUp className="w-4 h-4" />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1 space-y-0.5">
            {includeAllOption && (
              <Select.Item
                value="ALL"
                className="flex items-center justify-between px-3 py-2 text-xs md:text-sm font-medium text-[var(--text-primary)] rounded-lg hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 focus:bg-purple-500/10 focus:text-purple-600 dark:focus:text-purple-400 focus:outline-none cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span>🏢</span>
                  <Select.ItemText>
                    {allOptionLabel || `Semua Tenan (${tenants.length})`}
                  </Select.ItemText>
                </div>
                <Select.ItemIndicator className="text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
              </Select.Item>
            )}

            {tenants.map((t) => (
              <Select.Item
                key={t.id}
                value={t.id}
                className="flex items-center justify-between px-3 py-2 text-xs md:text-sm font-medium text-[var(--text-primary)] rounded-lg hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 focus:bg-purple-500/10 focus:text-purple-600 dark:focus:text-purple-400 focus:outline-none cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Select.ItemText>
                    {t.name} {t.code ? `(${t.code})` : ''}
                  </Select.ItemText>
                </div>
                <Select.ItemIndicator className="text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex items-center justify-center h-6 text-[var(--text-muted)] cursor-default">
            <ChevronDown className="w-4 h-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};
export default TenantSelect;
