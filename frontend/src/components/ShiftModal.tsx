import React, { useState } from 'react';
import { X, UserCheck, Shield, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const { user, switchCashier, idleTimeoutMinutes } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const handleSwitch = async (email: string) => {
    await switchCashier(email);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Shift & Akun Kasir
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Active Cashier Banner */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              Kasir Aktif Saat Ini
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {user ? user.name : 'Budi Santoso'}
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              {user ? user.email : 'budi@kasirwarung.id'}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Shift Siang (08:00 - 16:00)</span>
            </div>
          </div>

          {/* Quick Cashier Shift Switch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Ganti Kasir / Serah Terima Shift:
            </label>
            <div className="space-y-2">
              <button
                onClick={() => handleSwitch('budi@kasirwarung.id')}
                className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-between transition-colors ${
                  user?.email === 'budi@kasirwarung.id'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold">Budi Santoso</p>
                  <p className="text-[11px] text-slate-400">Kasir Utama · Shift Siang</p>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">Pilih</span>
              </button>

              <button
                onClick={() => handleSwitch('siti@kasirwarung.id')}
                className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-between transition-colors ${
                  user?.email === 'siti@kasirwarung.id'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold">Siti Aminah</p>
                  <p className="text-[11px] text-slate-400">Pemilik & Kasir · Shift Sore</p>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">Pilih</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
            ⏱ Auto-logout inaktivitas: <strong>{idleTimeoutMinutes} menit</strong> (dikonfigurasi via .env)
          </div>

          {confirmLogout ? (
            <div className="bg-red-50/80 border border-red-200/90 rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-150">
              <p className="text-xs font-bold text-red-900">
                Konfirmasi Keluar dari Akun?
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Sesi aktif kasir akan diakhiri dan dialihkan ke halaman login.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmLogout(false);
                    onClose();
                    onLogout();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ya, Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
