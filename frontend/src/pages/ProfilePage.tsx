import React from 'react';
import {
  User,
  Shield,
  CheckCircle,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';

interface ProfilePageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar
        currentTab="profile"
        onNavigate={onNavigate}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* Card 1: Avatar, Identity */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{user?.name || 'Budi Santoso'}</h2>
              <p className="text-xs md:text-sm text-slate-500 font-mono mt-0.5">
                {user?.email || 'budi@kasirwarung.id'}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200/60">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Aktif & Terverifikasi</span>
              </span>
            </div>
          </div>

          {/* Card 2: Detailed Information in 1 Column */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Akun & Akses
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  Peran Akun / Akses
                </span>
                <p className="text-sm font-extrabold text-slate-900 uppercase">
                  {user?.role || 'KASIR'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-500" />
                  Unit Toko / Warung
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {user?.tenantName || (user?.role === 'ADMIN' ? 'Platform Administrator' : 'Kasir Warung')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  ID Pengguna (ObjectId)
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 truncate">
                  {user?.id || 'USR-2026-BUDI'}
                </p>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
