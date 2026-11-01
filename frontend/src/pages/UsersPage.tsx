import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  Mail,
  User,
  Lock,
  X,
} from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Cashier } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCashiers, useCashierMutations } from '../hooks/useQueries.ts';

export interface UsersPageProps {}
export type CashiersPageProps = UsersPageProps;

export const UsersPage: React.FC<UsersPageProps> = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // TanStack Query for users
  const {
    data: usersData,
    isLoading: loading,
    refetch: fetchUsers,
  } = useCashiers();
  const users = usersData?.data || [];

  // TanStack Mutations for users
  const { createCashier, updateCashier, deleteCashier } = useCashierMutations();

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Cashier | null>(null);

  // Form Fields for Add
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form Fields for Edit
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: Cashier) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditStatus(u.status || 'active');
    setEditPassword('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);
    try {
      const res: any = await createCashier.mutateAsync({
        name,
        username,
        email,
        password,
      });
      if (res?.success) {
        setFeedback({ message: res.message, type: 'success' });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal menambahkan pengguna', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updatePayload: any = {
        name: editName,
        status: editStatus,
      };
      if (editPassword && editPassword.trim().length >= 6) {
        updatePayload.password = editPassword.trim();
      }

      const res: any = await updateCashier.mutateAsync({ id: editingUser.id, data: updatePayload });
      if (res?.success) {
        setFeedback({ message: res.message, type: 'success' });
        setEditingUser(null);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memperbarui pengguna', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res: any = await deleteCashier.mutateAsync(id);
      if (res?.success) {
        setFeedback({ message: res.message, type: 'success' });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal menghapus pengguna', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <TopNavbar currentTab="cashiers" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs md:text-sm font-medium flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4.5 h-4.5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* User Table Container */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                {t('cashiers.title', 'Daftar Pengguna Toko Anda')}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t('cashiers.subtitle', 'Pengguna hanya dapat mengakses sistem dan transaksi di toko ini.')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, username, email..."
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:bg-[var(--bg-surface)] transition-colors placeholder:text-[var(--text-muted)]"
                />
              </div>

              <button
                onClick={() => fetchUsers()}
                disabled={loading}
                title={t('common.refresh', 'Segarkan Data')}
                className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-xl text-[var(--text-secondary)] transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-brand)]' : ''}`} />
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('cashiers.addCashier', 'Tambah Pengguna')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Username & Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs md:text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[var(--text-muted)]">
                      {loading ? 'Memuat daftar pengguna...' : 'Belum ada pengguna terdaftar. Klik "+ Tambah Pengguna" untuk menambahkan.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg-table-row-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{u.name}</p>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">ID: {u.id.substring(u.id.length - 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text-primary)]">@{u.username}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Ubah Pengguna"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <AlertDialog.Root>
                            <AlertDialog.Trigger asChild>
                              <button
                                type="button"
                                title="Hapus Pengguna"
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Portal>
                              <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in" />
                              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-modal)] rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-[var(--border-default)] focus:outline-none">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                                  <Trash2 className="w-5 h-5" />
                                </div>
                                <AlertDialog.Title className="text-base font-bold text-[var(--text-primary)]">
                                  Hapus Pengguna '{u.name}'?
                                </AlertDialog.Title>
                                <AlertDialog.Description className="text-xs md:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                                  Akun pengguna ini akan dihapus dari toko Anda dan tidak dapat lagi masuk ke sistem.
                                </AlertDialog.Description>
                                <div className="flex items-center justify-end gap-2.5 mt-5">
                                  <AlertDialog.Cancel asChild>
                                    <button
                                      type="button"
                                      className="px-3.5 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-xl cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
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

      {/* Modal: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-modal)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border-default)] p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500/10 text-[var(--color-brand)]">
                  <UserPlus className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-[var(--text-primary)] text-base">Tambah Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nama Lengkap Pengguna
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Siti Rahma"
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Username Pengguna
                </label>
                <div className="relative">
                  <span className="text-[var(--text-muted)] font-mono text-xs absolute left-3 top-2.5">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="siti_user"
                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email Pengguna
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="siti@warung.id"
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs md:text-sm font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ubah Data Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-modal)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border-default)] p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500/10 text-[var(--color-brand)]">
                  <Edit2 className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-bold text-[var(--text-primary)] text-base">Ubah Data Pengguna</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Status Akun
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg-dropdown)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Ganti Password (Kosongkan bila tidak diubah)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Isi jika ingin ubah kata sandi pengguna"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs md:text-sm font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl shadow-xs cursor-pointer"
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

export const CashiersPage = UsersPage;
export default UsersPage;
