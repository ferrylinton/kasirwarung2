import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  Package,
  Layers,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Category } from '../services/api.ts';
import { useCategories, useCategoryMutations } from '../hooks/useQueries.ts';

interface CategoriesPageProps {
  onNavigate?: (tab: any) => void;
  onFilterCategory?: (categoryName: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onNavigate,
  onFilterCategory,
}) => {
  const { user } = useAuth();
  const isShopOwner = user?.role === 'SHOP_OWNER' || user?.role === 'pemilik';

  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // TanStack Query for categories
  const {
    data: categoriesData,
    isLoading: loading,
    refetch: fetchCategories,
  } = useCategories();
  const categories = categoriesData?.data || [];

  // TanStack Mutations for category CRUD
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [formColor, setFormColor] = useState('#F59E0B');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    if (!isShopOwner) {
      setNotification({
        type: 'error',
        message: 'Hanya role SHOP_OWNER yang bisa menambah data kategori.',
      });
      return;
    }
    setEditingCategory(null);
    setFormName('');
    setFormDesc('');
    setFormIcon('📦');
    setFormColor('#F59E0B');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    if (!isShopOwner) {
      setNotification({
        type: 'error',
        message: 'Hanya role SHOP_OWNER yang bisa mengubah data kategori.',
      });
      return;
    }
    setEditingCategory(category);
    setFormName(category.name);
    setFormDesc(category.description || '');
    setFormIcon(category.icon || '📦');
    setFormColor(category.color || '#F59E0B');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');

      if (editingCategory) {
        // Update via TanStack Mutation
        const res: any = await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: {
            name: formName.trim(),
            description: formDesc.trim(),
            icon: formIcon,
            color: formColor,
          },
        });

        if (res?.success) {
          setNotification({
            type: 'success',
            message: `Kategori "${res.data.name}" berhasil diperbarui.`,
          });
          setIsModalOpen(false);
        } else {
          setFormError(res?.message || 'Gagal memperbarui kategori');
        }
      } else {
        // Create via TanStack Mutation
        const res: any = await createCategory.mutateAsync({
          name: formName.trim(),
          description: formDesc.trim(),
          icon: formIcon,
          color: formColor,
        });

        if (res?.success) {
          setNotification({
            type: 'success',
            message: `Kategori "${res.data.name}" berhasil ditambahkan.`,
          });
          setIsModalOpen(false);
        } else {
          setFormError(res?.message || 'Gagal menambahkan kategori');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      const res: any = await deleteCategory.mutateAsync(categoryToDelete.id);
      if (res?.success) {
        setNotification({
          type: 'success',
          message: res.message || `Kategori "${categoryToDelete.name}" berhasil dihapus.`,
        });
        setCategoryToDelete(null);
      } else {
        setNotification({
          type: 'error',
          message: res?.message || 'Gagal menghapus kategori.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menghapus.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopNavbar currentTab="categories" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-end gap-2.5 flex-wrap">
            <button
              onClick={() => fetchCategories()}
              disabled={loading}
              title="Muat Ulang Kategori"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isShopOwner ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah Kategori</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Hanya SHOP_OWNER yang bisa mengedit</span>
              </div>
            )}
          </div>

          {/* Role Access Restriction Banner for non-SHOP_OWNER */}
          {!isShopOwner && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-center gap-3 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Mode Tinjauan: </span>
                Sesuai kebijakan sistem, <strong>hanya role SHOP_OWNER</strong> yang memiliki hak akses untuk menambah, mengubah, atau menghapus data kategori dan produk toko.
              </div>
            </div>
          )}

          {/* Notification Alert */}
          {notification && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in duration-200 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}


          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kategori produk berdasarkan nama atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs transition-all"
            />
          </div>

          {/* Category Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Tags className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori Produk'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada kategori yang cocok dengan pencarian Anda. Coba kata kunci lain.'
                  : 'Tambahkan kategori baru untuk mulai mengorganisasi produk di kasir Anda.'}
              </p>
              {isShopOwner && !searchQuery && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs md:text-sm rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs border border-black/5"
                          style={{ backgroundColor: `${category.color || '#F59E0B'}18` }}
                        >
                          {category.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {category.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>{category.productCount || 0} Produk</span>
                          </span>
                        </div>
                      </div>

                      {/* Accent Color Dot */}
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                        style={{ backgroundColor: category.color || '#F59E0B' }}
                        title={`Aksen: ${category.color || '#F59E0B'}`}
                      />
                    </div>

                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {category.description || 'Tidak ada deskripsi untuk kategori ini.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (onFilterCategory) onFilterCategory(category.name);
                        if (onNavigate) onNavigate('products');
                      }}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Lihat Produk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {isShopOwner && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(category)}
                          title="Ubah Kategori"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(category)}
                          title="Hapus Kategori"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Category Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCategory ? 'Ubah Kategori Produk' : 'Tambah Kategori Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hanya role SHOP_OWNER yang memiliki wewenang ini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Nama Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Nama Kategori</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bumbu Dapur, Camilan Manis..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan singkat jenis produk yang masuk ke kategori ini..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Radix Alert Dialog */}
      <AlertDialog.Root
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 shadow-2xl z-50 w-[92vw] max-w-md border border-slate-200 animate-in fade-in zoom-in-95 focus:outline-none">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>

            <AlertDialog.Title className="text-base md:text-lg font-bold text-slate-900">
              Hapus Kategori "{categoryToDelete?.name}"?
            </AlertDialog.Title>

            <AlertDialog.Description className="text-xs md:text-sm text-slate-600 mt-2 space-y-2 leading-relaxed">
              <p>
                Apakah Anda yakin ingin menghapus kategori ini? Aksi ini hanya dapat dilakukan oleh pemilik toko (SHOP_OWNER).
              </p>
              {categoryToDelete && (categoryToDelete.productCount || 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <strong>Pemberitahuan:</strong> Terdapat{' '}
                  <span className="font-bold">{categoryToDelete.productCount} produk</span> yang saat ini terhubung ke kategori ini. Semua produk tersebut akan otomatis dialihkan ke kategori <em>"Lainnya"</em> agar tidak hilang dari kasir POS.
                </div>
              )}
            </AlertDialog.Description>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Ya, Hapus Kategori</span>
                  )}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
};

export default CategoriesPage;
