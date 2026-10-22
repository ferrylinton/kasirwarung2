import React from 'react';
import * as Select from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SupportedLanguage } from '../i18n.ts';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const currentLang = (i18n.language?.startsWith('en') ? 'en' : 'id') as SupportedLanguage;

  const handleValueChange = (val: string) => {
    i18n.changeLanguage(val);
  };

  return (
    <Select.Root value={currentLang} onValueChange={handleValueChange}>
      <Select.Trigger
        aria-label={t('common.selectLanguage', 'Pilih Bahasa')}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer ${
          variant === 'full' ? 'w-full py-2.5 text-sm' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <Select.Value>
            <span className="flex items-center gap-1.5 truncate">
              {currentLang === 'id' ? (
                <>
                  <span className="text-sm leading-none">🇮🇩</span>
                  <span>{variant === 'full' ? 'Bahasa Indonesia' : 'ID'}</span>
                </>
              ) : (
                <>
                  <span className="text-sm leading-none">🇬🇧</span>
                  <span>{variant === 'full' ? 'English (US)' : 'EN'}</span>
                </>
              )}
            </span>
          </Select.Value>
        </div>
        <Select.Icon asChild>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          align="end"
          className="z-50 min-w-[160px] overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200 text-xs font-semibold text-slate-800 animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <Select.Viewport className="p-0.5 space-y-0.5">
            <Select.Item
              value="id"
              className="relative flex items-center justify-between gap-3 px-3 py-2 rounded-xl outline-none select-none hover:bg-orange-50 hover:text-orange-900 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-900 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🇮🇩</span>
                <Select.ItemText>Bahasa Indonesia</Select.ItemText>
              </div>
              <Select.ItemIndicator className="text-[#EC6C1A]">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </Select.ItemIndicator>
            </Select.Item>

            <Select.Item
              value="en"
              className="relative flex items-center justify-between gap-3 px-3 py-2 rounded-xl outline-none select-none hover:bg-orange-50 hover:text-orange-900 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-900 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🇬🇧</span>
                <Select.ItemText>English (US)</Select.ItemText>
              </div>
              <Select.ItemIndicator className="text-[#EC6C1A]">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </Select.ItemIndicator>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default LanguageSelector;
