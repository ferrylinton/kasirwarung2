import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface IdleTimerModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const IdleTimerModal: React.FC<IdleTimerModalProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[var(--bg-modal)] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--border-default)] text-center space-y-4 animate-in fade-in zoom-in-95 text-[var(--text-primary)]">
        <div className="w-14 h-14 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h4 className="text-lg font-bold text-[var(--text-primary)]">
            Sesi Hampir Berakhir
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Tidak ada aktivitas terdeteksi. Sistem akan otomatis logout demi keamanan kasir dalam:
          </p>
        </div>

        <div className="text-3xl font-extrabold text-[#EC6C1A] dark:text-orange-400 font-mono">
          {secondsRemaining} detik
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onLogoutNow}
            className="flex-1 py-2.5 border border-[var(--border-default)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Logout Sekarang
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 py-2.5 bg-[#EC6C1A] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Tetap Masuk
          </button>
        </div>
      </div>
    </div>
  );
};
