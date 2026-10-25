import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Terminal,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab, TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

export interface ErrorPageProps {
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  statusCode?: number;
  title?: string;
  message?: string;
  onReset?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  isFullPage?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  errorInfo,
  statusCode = 500,
  title,
  message,
  onReset,
  onNavigate,
  isFullPage = false,
}) => {
  const { user } = useAuth();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSentStatus, setReportSentStatus] = useState<string | null>(null);

  const defaultHomeTab: ActiveTab = user?.role === 'ADMIN' ? 'tenants' : 'pos';

  const errorMessage =
    message ||
    error?.message ||
    'Terjadi kesalahan saat merender antarmuka aplikasi Kasir Warung.';

  const errorStack =
    error?.stack ||
    errorInfo?.componentStack ||
    'Tidak ada detail call stack yang tersedia.';

  const handleCopyReport = () => {
    const reportText = [
      `=== KASIR WARUNG ERROR REPORT ===`,
      `Status Code: ${statusCode}`,
      `Timestamp: ${new Date().toISOString()}`,
      `User Role: ${user?.role || 'Guest'}`,
      `Tenant ID: ${user?.tenantId || 'None'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `Error Message: ${errorMessage}`,
      `\nStack Trace:\n${errorStack}`,
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendErrorReport = async () => {
    try {
      setIsSendingReport(true);
      setReportSentStatus(null);
      await api.simulateLog({
        level: 'error',
        message: `[Frontend Crash] ${errorMessage}`,
        meta: {
          statusCode,
          url: typeof window !== 'undefined' ? window.location.href : '',
          stack: errorStack,
          role: user?.role || 'Guest',
          tenantId: user?.tenantId || null,
          time: new Date().toISOString(),
        },
      });
      setReportSentStatus('Laporan berhasil dicatat ke sistem Winston log.');
    } catch {
      setReportSentStatus('Gagal mengirim log otomatis ke server.');
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleClearCacheAndReset = () => {
    if (
      window.confirm(
        'Bersihkan cache sementara aplikasi? Anda mungkin perlu login ulang jika sesi dihapus.'
      )
    ) {
      try {
        sessionStorage.clear();
        localStorage.removeItem('kasir_cart_draft');
      } catch {
        // Ignored
      }
      if (onReset) {
        onReset();
      } else {
        window.location.reload();
      }
    }
  };

  const handleReload = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const content = (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col items-center">
      {/* Visual Error Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-10 flex flex-col items-center text-center">
        {/* Animated Visual Warning Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-inner">
            <AlertTriangle className="w-12 h-12 md:w-14 md:h-14 stroke-[1.75]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md shadow-xs border border-rose-700">
            {statusCode}
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {title || 'Terjadi Gangguan Pada Sistem'}
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-xl mb-4 leading-relaxed">
          {errorMessage}
        </p>

        {/* Data Safety Assurance */}
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3.5 py-2 mb-8 max-w-md w-full justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Data transaksi toko dan akun Anda tersimpan aman di database</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg mb-8">
          <button
            onClick={handleReload}
            type="button"
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>

          <button
            onClick={() => {
              if (onReset) onReset();
              onNavigate?.(defaultHomeTab);
            }}
            type="button"
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 active:text-slate-900 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ke Menu Utama</span>
          </button>

          {(user?.role === 'ADMIN' || user?.role === 'SHOP_OWNER') && (
            <button
              onClick={() => {
                if (onReset) onReset();
                onNavigate?.('system-logs');
              }}
              type="button"
              className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Buka Log Sistem</span>
            </button>
          )}
        </div>

        {/* Additional Utility Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100 w-full">
          <button
            onClick={handleClearCacheAndReset}
            className="inline-flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer"
            type="button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Cache Lokal</span>
          </button>

          <span aria-hidden="true" className="text-slate-300">·</span>

          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
            type="button"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Laporan Disalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Laporan Error</span>
              </>
            )}
          </button>

          <span aria-hidden="true" className="text-slate-300">·</span>

          <button
            onClick={handleSendErrorReport}
            disabled={isSendingReport}
            className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer disabled:opacity-50"
            type="button"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingReport ? 'Mencatat...' : 'Kirim Log ke Server'}</span>
          </button>
        </div>

        {reportSentStatus && (
          <p className="mt-3 text-xs text-slate-600 font-medium">
            {reportSentStatus}
          </p>
        )}
      </div>

      {/* Collapsible Technical Details for Admins & Developers */}
      <div className="w-full mt-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          type="button"
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>Informasi Diagnostik & Call Stack (Pengembang / Admin)</span>
          </div>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-slate-200/80 bg-slate-950 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-rose-400 font-bold truncate max-w-md">
                {error?.name || 'Error'}: {errorMessage}
              </span>
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                type="button"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-400 font-mono">
              {errorStack}
            </pre>
          </div>
        )}
      </div>
    </main>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      <TopNavbar currentTab="error" onNavigate={onNavigate} />
      {content}
    </div>
  );
};

export default ErrorPage;
