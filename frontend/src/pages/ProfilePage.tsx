import React from 'react';
import {
  User,
  Shield,
  CheckCircle,
  Store,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { ADMIN } from '../constants/roles.ts';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <TopNavbar
        currentTab="profile"
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* Card 1: Avatar, Identity */}
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 md:p-8 border border-[var(--border-default)] shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{user?.name || 'Budi Santoso'}</h2>
              <p className="text-xs md:text-sm text-[var(--text-muted)] font-mono mt-0.5">
                {user?.email || 'budi@kasirwarung.id'}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Aktif & Terverifikasi</span>
              </span>
            </div>
          </div>

          {/* Card 2: Detailed Information in 1 Column */}
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 md:p-8 border border-[var(--border-default)] shadow-xs space-y-5">
            <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">
              Informasi Akun & Akses
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-brand)]" />
                  Peran Akun / Akses
                </span>
                <p className="text-sm font-extrabold text-[var(--text-primary)] uppercase">
                  {user?.role || 'KASIR'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-2">
                  <Store className="w-4 h-4 text-[var(--color-brand)]" />
                  Unit Toko / Warung
                </span>
                <p className="text-sm font-extrabold text-[var(--text-primary)]">
                  {user?.tenantName || (user?.role === ADMIN ? 'Platform Administrator' : 'Kasir Warung')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-brand)]" />
                  ID Pengguna (ObjectId)
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-[var(--text-secondary)] truncate">
                  {user?.id || 'USR-2026-BUDI'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Theme Preferences */}
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 md:p-8 border border-[var(--border-default)] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3">
              <span className="p-2 rounded-xl bg-orange-500/10 text-[var(--color-brand)]">
                <Palette className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Preferensi Tema Tampilan
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Pilih mode tampilan Terang, Gelap, atau Otomatis sesuai sistem Anda.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <ThemeToggle variant="cards" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
