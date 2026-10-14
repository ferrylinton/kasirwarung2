import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  Clock,
  Mail,
  User,
  Lock,
  X,
} from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { api, Cashier } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface CashiersPageProps {
  onBackToPos?: () => void;
  onNavigate?: (tab: any) => void;
}

export const CashiersPage: React.FC<CashiersPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);

  // Form Fields for Add
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shift, setShift] = useState('Shift Pagi (08:00 - 16:00)');

  // Form Fields for Edit
  const [editName, setEditName] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const res = await api.getCashiers();
      if (res.success && Array.isArray(res.data)) {
        setCashiers(res.data);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memuat data staf kasir', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setShift('Shift Pagi (08:00 - 16:00)');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Cashier) => {
    setEditingCashier(c);
    setEditName(c.name);
    setEditShift(c.shift || 'Shift Pagi (08:00 - 16:00)');
    setEditStatus(c.status || 'active');
    setEditPassword('');
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.createCashier({
        name,
        username,
        email,
        password,
        shift,
      });
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        setIsAddModalOpen(false);
        await fetchCashiers();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal menambahkan kasir', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updatePayload: any = {
        name: editName,
        shift: editShift,
        status: editStatus,
      };
      if (editPassword && editPassword.trim().length >= 6) {
        updatePayload.password = editPassword.trim();
      }

      const res = await api.updateCashier(editingCashier.id, updatePayload);
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        setEditingCashier(null);
        await fetchCashiers();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memperbarui kasir', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCashier = async (id: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.deleteCashier(id);
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        await fetchCashiers();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal menghapus kasir', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCashiers = cashiers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const activeCount = cashiers.filter((c) => c.status === 'active').length;
  const inactiveCount = cashiers.filter((c) => c.status === 'inactive').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="cashiers" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-orange-100 text-orange-600 shadow-2xs">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Kelola Staf Kasir (SHOP_CASHIER)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                  Pemilik Toko
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500">
                Tambah, ubah data shift, dan kelola akses kasir toko Anda ({user?.tenantName || 'Toko'}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCashiers}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Kasir</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs md:text-sm font-medium flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Total Staf Kasir</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{cashiers.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Kasir Aktif</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold">Kasir Nonaktif</span>
            <p className="text-2xl font-bold text-slate-400 mt-1">{inactiveCount}</p>
          </div>
        </div>

        {/* Cashier Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-800">
                Daftar Kasir Toko Anda
              </h2>
              <p className="text-xs text-slate-500">
                Staf kasir hanya dapat mengakses kasir dan transaksi di toko ini.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Username & Email</th>
                  <th className="py-3 px-4">Jadwal Shift</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                {filteredCashiers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      {loading ? 'Memuat daftar kasir...' : 'Belum ada staf kasir terdaftar. Klik "+ Tambah Kasir" untuk menambahkan.'}
                    </td>
                  </tr>
                ) : (
                  filteredCashiers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <span className="text-[10px] font-mono text-slate-400">ID: {c.id.substring(c.id.length - 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">@{c.username}</p>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {c.shift || 'Shift Pagi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Ubah Kasir"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <AlertDialog.Root>
                            <AlertDialog.Trigger asChild>
                              <button
                                type="button"
                                title="Hapus Kasir"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Portal>
                              <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 focus:outline-none">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                                  <Trash2 className="w-5 h-5" />
                                </div>
                                <AlertDialog.Title className="text-base font-bold text-slate-900">
                                  Hapus Kasir '{c.name}'?
                                </AlertDialog.Title>
                                <AlertDialog.Description className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                  Akun kasir ini akan dihapus dari toko Anda dan tidak dapat lagi masuk ke sistem kasir.
                                </AlertDialog.Description>
                                <div className="flex items-center justify-end gap-2.5 mt-5">
                                  <AlertDialog.Cancel asChild>
                                    <button
                                      type="button"
                                      className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                    >
                                      Batal
                                    </button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCashier(c.id)}
                                      className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                                    >
                                      Ya, Hapus
                                    </button>
                                  </AlertDialog.Action>
                                </div>
                              </AlertDialog.Content>
                            </AlertDialog.Portal>
                          </AlertDialog.Root>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Tambah Kasir Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <UserPlus className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Tambah Kasir Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Kasir
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Siti Rahma"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Kasir
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-mono text-xs absolute left-3 top-2.5">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="siti_kasir"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Kasir
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="siti@warung.id"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
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
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jadwal Shift
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option value="Shift Pagi (08:00 - 16:00)">Shift Pagi (08:00 - 16:00)</option>
                  <option value="Shift Sore (16:00 - 22:00)">Shift Sore (16:00 - 22:00)</option>
                  <option value="Shift Malam (22:00 - 06:00)">Shift Malam (22:00 - 06:00)</option>
                  <option value="Shift Fleksibel / Penuh">Shift Fleksibel / Penuh</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs md:text-sm font-bold bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Kasir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ubah Data Kasir */}
      {editingCashier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <Edit2 className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Ubah Data Kasir</h3>
              </div>
              <button
                onClick={() => setEditingCashier(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCashier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kasir
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Operasional
                </label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option value="Shift Pagi (08:00 - 16:00)">Shift Pagi (08:00 - 16:00)</option>
                  <option value="Shift Sore (16:00 - 22:00)">Shift Sore (16:00 - 22:00)</option>
                  <option value="Shift Malam (22:00 - 06:00)">Shift Malam (22:00 - 06:00)</option>
                  <option value="Shift Fleksibel / Penuh">Shift Fleksibel / Penuh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akun
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ganti Password (Kosongkan bila tidak diubah)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Isi jika ingin ubah kata sandi kasir"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCashier(null)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs md:text-sm font-bold bg-[#EC6C1A] hover:bg-orange-600 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
