import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Password pengguna berhasil diperbarui! Anda dapat menggunakannya pada sesi berikutnya.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <TopNavbar currentTab="change-password" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto w-full space-y-6">

        {/* Form Card */}
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-default)] shadow-xs p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-700 dark:text-red-400 text-xs md:text-sm font-medium border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-400 text-xs md:text-sm font-bold border border-green-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Password Saat Ini
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini (cth: kasir123)"
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--border-default)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--border-default)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--border-default)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
            </div>

            {/* Password security tips */}
            <div className="bg-[var(--bg-muted)] p-3.5 rounded-2xl border border-[var(--border-subtle)] flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)]">
              <ShieldAlert className="w-4 h-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
              <span>
                Gunakan kombinasi minimal 6 karakter. Pastikan password mudah diingat oleh pengguna yang bertugas namun sulit ditebak pihak luar.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 text-white rounded-xl font-bold text-xs md:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Perbarui Password Kasir'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
};

export default ChangePasswordPage;
