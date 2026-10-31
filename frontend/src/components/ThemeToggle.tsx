import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented' | 'cards';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  if (variant === 'segmented') {
    const options: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
      {
        mode: 'light',
        label: t('common.themeLight', 'Terang'),
        icon: <Sun className="w-4 h-4 text-amber-500" />,
      },
      {
        mode: 'dark',
        label: t('common.themeDark', 'Gelap'),
        icon: <Moon className="w-4 h-4 text-blue-400" />,
      },
      {
        mode: 'system',
        label: t('common.themeSystem', 'Sistem'),
        icon: <Monitor className="w-4 h-4 text-slate-400" />,
      },
    ];

    return (
      <div className={`grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 ${className}`}>
        {options.map((opt) => {
          const active = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {/* Light Card */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
            theme === 'light'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shadow-2xs">
              <Sun className="w-5 h-5" />
            </div>
            {theme === 'light' && (
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/40" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t('common.themeLight', 'Mode Terang')}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Kontras cerah dan tajam
            </p>
          </div>
        </button>

        {/* Dark Card */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
            theme === 'dark'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shadow-2xs">
              <Moon className="w-5 h-5" />
            </div>
            {theme === 'dark' && (
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/40" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t('common.themeDark', 'Mode Gelap')}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Nyaman untuk mata malam hari
            </p>
          </div>
        </button>

        {/* System Card */}
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
            theme === 'system'
              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-2xs">
              <Monitor className="w-5 h-5" />
            </div>
            {theme === 'system' && (
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/40" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t('common.themeSystem', 'Otomatis Sistem')}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Sinkron dengan perangkat
            </p>
          </div>
        </button>
      </div>
    );
  }

  // Default compact toggle for TopNavbar & headers
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={
        isDark
          ? `${t('common.themeToggle', 'Ganti Mode Tampilan')}: ${t('common.themeLight', 'Mode Terang')}`
          : `${t('common.themeToggle', 'Ganti Mode Tampilan')}: ${t('common.themeDark', 'Mode Gelap')}`
      }
      aria-label={t('common.themeToggle', 'Ganti Mode Tampilan')}
      className={`h-9 md:h-10 px-2.5 sm:px-3 rounded-full bg-slate-100 hover:bg-orange-50 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs outline-none focus:ring-2 focus:ring-orange-500/20 active:scale-95 ${className}`}
    >
      <div className="flex items-center justify-center shrink-0">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 hover:text-orange-600 transition-colors" />
        )}
      </div>
      <span className="hidden md:inline text-xs font-semibold select-none">
        {isDark ? t('common.themeLight', 'Terang') : t('common.themeDark', 'Gelap')}
      </span>
    </button>
  );
};
