import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Product, Category, SHOP_OWNER } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import { ProductFilterBar } from '../components/ProductFilterBar.tsx';
import { useProducts, useCategories, useProductMutations } from '../hooks/useQueries.ts';

const CATEGORIES = [
  'Semua Produk',
  'Makanan Instan',
  'Minuman',
  'Sembako',
  'Camilan',
  'Kebutuhan Rumah',
];

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isShopOwner = user?.role === SHOP_OWNER;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Produk');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // TanStack Query for products & categories
  const {
    data: productsData,
    isLoading: loading,
    refetch: fetchProducts,
  } = useProducts(searchQuery, selectedCategory);
  const products = productsData?.data || [];

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data || [];

  // TanStack Mutations
  const { deleteProduct } = useProductMutations();

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Reset pagination when search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = products.slice(startIndex, endIndex);

  const renderStockBadge = (stock: number) => {
    const isLowStock = (stock || 0) < 15;
    const isOutOfStock = (stock || 0) <= 0;

    if (isOutOfStock) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/60">
          Habis
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
          Menipis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/60">
        Tersedia
      </span>
    );
  };

  const handleOpenAdd = () => {
    if (!isShopOwner) {
      alert('Hanya role SHOP_OWNER yang bisa menambah data produk.');
      return;
    }
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    if (!isShopOwner) {
      alert('Hanya role SHOP_OWNER yang bisa mengubah data produk.');
      return;
    }
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!isShopOwner) {
      alert('Hanya role SHOP_OWNER yang bisa menghapus data produk.');
      return;
    }
    if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
      try {
        const res: any = await deleteProduct.mutateAsync(p.id);
        if (!res?.success) {
          alert(res?.message || 'Gagal menghapus produk');
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus produk');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <TopNavbar currentTab="products" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-end gap-2.5 flex-wrap">
            <button
              onClick={() => fetchProducts()}
              disabled={loading}
              title={t('common.refresh', 'Segarkan Data')}
              className="p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>

            {isShopOwner ? (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#EC6C1A] hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t('products.addProduct', 'Tambah Produk Baru')}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Hanya SHOP_OWNER yang dapat mengelola produk</span>
              </div>
            )}
          </div>

          {/* Filter & Search Bar Component */}
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />

          {/* Products Inventory Card (Responsive: Mobile Cards + Tablet/Desktop Table + Pagination) */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-default)] shadow-xs overflow-hidden transition-colors duration-200">
            {/* Card Header */}
            <div className="p-4 md:p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-table-header)]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm md:text-base">
                  {t('products.title', 'Daftar Barang Dagangan')} ({totalItems})
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">{t('common.appTitle', 'Kasir Warung POS')}</span>
            </div>

            {/* Mobile View: Responsive Product Cards (< md) */}
            <div className="block md:hidden divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                  Memuat data inventaris produk...
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                paginatedProducts.map((p) => (
                  <div key={p.id} className="p-4 space-y-3 hover:bg-[var(--bg-table-row-hover)] transition-colors">
                    {/* Top: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{p.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          <span className="font-mono text-[11px]">{p.sku || '-'}</span>
                          <span>·</span>
                          <span className="text-[var(--text-secondary)]">{p.category}</span>
                        </div>
                      </div>
                      <div className="shrink-0">{renderStockBadge(p.stock)}</div>
                    </div>

                    {/* Middle: Price & Stock metrics */}
                    <div className="grid grid-cols-2 gap-2 bg-[var(--bg-subtle)] p-2.5 rounded-xl border border-[var(--border-default)] text-xs">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Harga Jual</span>
                        <span className="font-bold text-[var(--text-primary)] text-sm tabular-nums">
                          Rp{p.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Sisa Stok</span>
                        <span className="font-mono font-bold text-[var(--text-primary)] text-sm tabular-nums">
                          {p.stock} pcs
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Quick Actions */}
                    <div className="flex items-center justify-between pt-0.5">
                      {isShopOwner ? (
                        <div className="flex items-center justify-end w-full gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] active:scale-95 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Ubah</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 rounded-lg transition-all cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-center py-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--border-default)]">
                            <Shield className="w-3 h-3 text-[var(--text-muted)]" />
                            <span>Hanya Baca</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tablet & Desktop View: High-Density Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-xs md:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                        Memuat data inventaris produk...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                        Tidak ada produk yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-table-row-hover)] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">
                          {p.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--text-muted)]">
                          {p.sku || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] tabular-nums">
                          Rp{p.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                          {p.stock} pcs
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStockBadge(p.stock)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isShopOwner ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="Ubah Data Produk"
                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[var(--text-muted)] hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                title="Hapus Produk"
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--border-default)]">
                                <Shield className="w-3 h-3 text-[var(--text-muted)]" />
                                <span>Hanya Baca</span>
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            {totalItems > 0 && (
              <div className="p-3.5 md:p-4 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-table-header)] text-xs text-[var(--text-secondary)]">
                {/* Left: Summary */}
                <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                  <span className="font-medium text-[var(--text-secondary)]">
                    Menampilkan{' '}
                    <span className="font-bold text-[var(--text-primary)] tabular-nums">
                      {startIndex + 1}
                    </span>
                    –
                    <span className="font-bold text-[var(--text-primary)] tabular-nums">
                      {endIndex}
                    </span>{' '}
                    dari{' '}
                    <span className="font-bold text-[var(--text-primary)] tabular-nums">
                      {totalItems}
                    </span>{' '}
                    produk
                  </span>
                </div>

                {/* Right: Page Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                    aria-label={t('common.paginationPrevious', 'Halaman Sebelumnya')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.paginationPrevious', 'Sebelumnya')}</span>
                  </button>

                  {/* Page Number Buttons */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true;
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - safeCurrentPage) <= 1
                        );
                      })
                      .map((page, idx, arr) => {
                        const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-1 text-[var(--text-muted)] select-none">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                safeCurrentPage === page
                                  ? 'bg-[#EC6C1A] text-white shadow-2xs'
                                  : 'border border-[var(--border-default)] text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                    aria-label={t('common.paginationNext', 'Halaman Selanjutnya')}
                  >
                    <span className="hidden sm:inline">{t('common.paginationNext', 'Selanjutnya')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit / Add Product Modal Dialog */}
      <ProductModal
        isOpen={isModalOpen}
        initialProduct={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchProducts}
      />
    </div>
  );
};

export default ProductsPage;
