import React, { useState } from 'react';
import { ShoppingBag, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('budi@kasirwarung.id');
  const [password, setPassword] = useState('kasir123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('kasir');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal autentikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Brand Lockup with KasirWarung Logo */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-b from-orange-50/50 to-emerald-50/50 border border-orange-100 rounded-3xl p-2.5 flex items-center justify-center mx-auto shadow-sm">
            <img
              src="/src/assets/images/kasir_warung_logo_1791830546088.jpg"
              alt="Logo KasirWarung"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kasir Warung POS
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Daftar akun kasir atau pemilik toko baru'
              : 'Silakan masuk untuk mengoperasikan kasir'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@kasirwarung.id"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peran Akun
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="kasir">Kasir Toko</option>
                <option value="pemilik">Pemilik Warung (Owner)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#EC6C1A] hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>{loading ? 'Memproses...' : isRegister ? 'Daftar Akun' : 'Masuk ke Kasir'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        {!isRegister && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              Akun Kasir Bawaan:
            </p>
            <p className="font-mono">Email: budi@kasirwarung.id</p>
            <p className="font-mono">Password: kasir123</p>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            {isRegister
              ? 'Sudah punya akun? Masuk disini'
              : 'Belum punya akun? Buat akun baru'}
          </button>
        </div>
      </div>
    </div>
  );
};
