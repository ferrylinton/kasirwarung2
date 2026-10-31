import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Clock, KeyRound } from 'lucide-react';

interface CaptchaFieldProps {
  captchaId: string;
  imageSvg: string;
  captchaCode: string;
  onCodeChange: (code: string) => void;
  onReload: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const CaptchaField: React.FC<CaptchaFieldProps> = ({
  captchaId,
  imageSvg,
  captchaCode,
  onCodeChange,
  onReload,
  isLoading,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-orange-500" />
          <span>{t('auth.captcha', 'Kode Keamanan (CAPTCHA)')}</span>
          <span className="text-red-500">*</span>
        </label>
        <span className="text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-slate-400" />
          {t('auth.captchaHelp', 'Huruf kapital & angka • 5 menit')}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Captcha Image Frame & Reload Button */}
        <div className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl p-1.5 shrink-0 shadow-2xs">
          <div className="h-11 w-40 flex items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
            {isLoading ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span className="text-[11px]">{t('auth.reloadingCaptcha', 'Memuat...')}</span>
              </div>
            ) : imageSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: imageSvg }}
                className="w-full h-full flex items-center justify-center select-none"
              />
            ) : (
              <div className="text-[11px] text-slate-400 text-center px-2">
                {t('common.error', 'Gagal memuat')}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReload}
            disabled={isLoading || disabled}
            title={t('auth.reloadCaptcha', 'Muat ulang kode captcha')}
            aria-label={t('auth.reloadCaptcha', 'Muat ulang kode captcha')}
            className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform duration-300 ${
                isLoading ? 'animate-spin text-orange-600' : 'hover:rotate-45'
              }`}
            />
          </button>
        </div>

        {/* Captcha Input */}
        <div className="relative flex-1">
          <input
            type="text"
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength={6}
            disabled={disabled || isLoading}
            value={captchaCode}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder={t('auth.captchaPlaceholder', 'Ketik 5 karakter di samping')}
            className="w-full px-3.5 py-2.5 h-12 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 bg-white dark:bg-slate-800/90"
          />
        </div>
      </div>
      <input type="hidden" name="captchaId" value={captchaId} />
    </div>
  );
};
