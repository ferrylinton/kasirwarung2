import React from 'react';
import * as Select from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { SupportedLanguage } from '../i18n.ts';

/**
 * Circular flag icon badges inspired by Flaticon's language-flag vector collections.
 * Features a crisp circular badge with a subtle border and shadow (border border-black/15 shadow-sm)
 * so white and red portions remain clearly visible on matching background colors.
 */
export const IndonesiaFlag: React.FC<{ className?: string }> = ({
  className = 'w-4.5 h-4.5',
}) => (
  <span
    aria-hidden="true"
    className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden border border-black/15 shadow-sm bg-white select-none ${className}`}
  >
    <svg viewBox="0 0 32 32" className="w-full h-full block" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="16" fill="#E11D48" />
      <rect y="16" width="32" height="16" fill="#FFFFFF" />
      <line x1="0" y1="16" x2="32" y2="16" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
    </svg>
  </span>
);

export const UKFlag: React.FC<{ className?: string }> = ({
  className = 'w-4.5 h-4.5',
}) => (
  <span
    aria-hidden="true"
    className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden border border-black/15 shadow-sm select-none ${className}`}
  >
    <svg viewBox="0 0 32 32" className="w-full h-full block" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="#012169" />
      {/* White diagonal saltire */}
      <line x1="0" y1="0" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="6" />
      <line x1="32" y1="0" x2="0" y2="32" stroke="#FFFFFF" strokeWidth="6" />
      {/* Red diagonal saltire */}
      <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2.5" />
      <line x1="32" y1="0" x2="0" y2="32" stroke="#C8102E" strokeWidth="2.5" />
      {/* White central cross */}
      <line x1="16" y1="0" x2="16" y2="32" stroke="#FFFFFF" strokeWidth="8" />
      <line x1="0" y1="16" x2="32" y2="16" stroke="#FFFFFF" strokeWidth="8" />
      {/* Red central cross */}
      <line x1="16" y1="0" x2="16" y2="32" stroke="#C8102E" strokeWidth="4.5" />
      <line x1="0" y1="16" x2="32" y2="16" stroke="#C8102E" strokeWidth="4.5" />
    </svg>
  </span>
);

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
        title={currentLang === 'id' ? 'Bahasa Indonesia' : 'English (US)'}
        className={`inline-flex items-center gap-1.5 sm:gap-2 border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer ${
          variant === 'compact'
            ? 'h-9 md:h-10 px-2.5 sm:px-3 text-xs md:text-sm font-semibold rounded-full justify-center sm:justify-between'
            : 'w-full h-10 md:h-11 px-3.5 py-2.5 text-sm font-semibold rounded-xl justify-between'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Select.Value>
            <span className="flex items-center gap-1.5 truncate">
              {currentLang === 'id' ? (
                <>
                  <IndonesiaFlag className="w-4.5 h-4.5 md:w-5 md:h-5" />
                  <span className={variant === 'compact' ? 'hidden sm:inline font-semibold' : 'font-semibold'}>
                    {variant === 'full' ? 'Bahasa Indonesia' : 'ID'}
                  </span>
                </>
              ) : (
                <>
                  <UKFlag className="w-4.5 h-4.5 md:w-5 md:h-5" />
                  <span className={variant === 'compact' ? 'hidden sm:inline font-semibold' : 'font-semibold'}>
                    {variant === 'full' ? 'English (US)' : 'EN'}
                  </span>
                </>
              )}
            </span>
          </Select.Value>
        </div>
        <Select.Icon asChild>
          <ChevronDown
            className={`w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              variant === 'compact' ? 'hidden sm:inline-block' : ''
            }`}
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          align="end"
          className="z-50 min-w-[170px] overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200 text-xs font-semibold text-slate-800 animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <Select.Viewport className="p-0.5 space-y-0.5">
            <Select.Item
              value="id"
              className="relative flex items-center justify-between gap-3 px-3 py-2 rounded-xl outline-none select-none hover:bg-orange-50 hover:text-orange-900 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-900 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <IndonesiaFlag className="w-5 h-5" />
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
              <div className="flex items-center gap-2.5">
                <UKFlag className="w-5 h-5" />
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
