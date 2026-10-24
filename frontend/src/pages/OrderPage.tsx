import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { SavedOrdersBar } from '../components/SavedOrdersBar.tsx';
import { ProductFilterBar } from '../components/ProductFilterBar.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { CartDrawer } from '../components/CartDrawer.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import { Product } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { RefreshCcw, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useQueries.ts';

const CATEGORIES = [
  'Semua Produk',
  'Makanan Instan',
  'Minuman',
  'Sembako',
  'Camilan',
  'Kebutuhan Rumah',
];

interface OrderPageProps {
  onNavigate?: (tab: any) => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Produk');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const mainRef = useRef<HTMLElement>(null);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const { user, logout } = useAuth();

  // TanStack Query for products & categories
  const {
    data: productsData,
    isLoading: loading,
    refetch: fetchProducts,
  } = useProducts(searchQuery, selectedCategory);
  const products = productsData?.data || [];

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedProducts = useMemo(() => {
    return products.slice(startIndex, endIndex);
  }, [products, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: categoriesData } = useCategories();
  const categoriesList = useMemo(() => {
    if (categoriesData?.data && categoriesData.data.length > 0) {
      return ['Semua Produk', ...categoriesData.data.map((c) => c.name)];
    }
    return CATEGORIES;
  }, [categoriesData]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      {/* Top Navbar with breadcrumb on left & tablet/mobile cart button with badge on right */}
      <TopNavbar
        currentTab="pos"
        onNavigate={onNavigate}
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Center Main POS Area */}
        <main ref={mainRef} className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-7">
          {/* ADMIN Notice Banner: role ADMIN tidak bisa bikin order */}
          {user?.role === 'ADMIN' && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-900 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">
                    {t('pos.adminNoticeTitle', 'Mode Akun Administrator Platform (Role ADMIN)')}
                  </p>
                  <p className="text-xs text-purple-700 mt-0.5">
                    {t('pos.adminNoticeDesc', 'Role ADMIN bertugas mengelola data tenan dan tidak dapat membuat order/transaksi. Hanya akun Pemilik Toko (SHOP_OWNER) atau Kasir (SHOP_CASHIER) yang dapat membuat transaksi penjualan.')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('tenants')}
                className="shrink-0 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                {t('common.openTenants', 'Buka Kelola Tenan →')}
              </button>
            </div>
          )}

          {/* Section: PESANAN DISIMPAN (BELUM DIBAYAR) */}
          <SavedOrdersBar onOpenAllSaved={() => onNavigate?.('history')} />

          {/* ProductFilterBar Component */}
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categoriesData?.data && categoriesData.data.length > 0 ? categoriesData.data : categoriesList}
            className="mb-4 mt-2"
          />

        {/* Product Cards Grid (4 columns on desktop matching screenshot) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-56 bg-white/70 rounded-2xl animate-pulse border border-slate-200/50"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/70">
            <p className="text-base font-semibold text-slate-600">
              {t('common.noProducts', 'Tidak ada produk ditemukan')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('common.noProductsHelp', 'Coba kata kunci lain atau tambahkan produk baru.')}
            </p>
            <button
              onClick={() => fetchProducts()}
              className="mt-4 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-600 rounded-lg flex items-center gap-1.5 hover:bg-orange-100 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>{t('common.reload', 'Muat Ulang')}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id || product.sku} product={product} />
              ))}
            </div>

            {/* Pagination Controls (10 items per page) */}
            {totalItems > 0 && (
              <div className="mt-5 mb-24 lg:mb-4 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                {/* Left: Info */}
                <div className="text-xs text-slate-500 font-medium">
                  {t('common.showing', 'Menampilkan')}{' '}
                  <span className="font-bold text-slate-900 tabular-nums">
                    {startIndex + 1}
                  </span>
                  –
                  <span className="font-bold text-slate-900 tabular-nums">
                    {endIndex}
                  </span>{' '}
                  {t('common.of', 'dari')}{' '}
                  <span className="font-bold text-slate-900 tabular-nums">
                    {totalItems}
                  </span>{' '}
                </div>

                {/* Right: Page Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold cursor-pointer"
                    aria-label={t('common.paginationPrevious', 'Halaman Sebelumnya')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.paginationPrevious', 'Sebelumnya')}</span>
                  </button>

                  {/* Page numbers with ellipsis */}
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
                              <span className="px-1 text-slate-400 select-none text-xs">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                safeCurrentPage === page
                                  ? 'bg-[#EC6C1A] text-white shadow-2xs'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold cursor-pointer"
                    aria-label={t('common.paginationNext', 'Halaman Selanjutnya')}
                  >
                    <span className="hidden sm:inline">{t('common.paginationNext', 'Selanjutnya')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Right Drawer: Order Cart */}
      <CartDrawer
        onOpenPayment={() => setIsPaymentOpen(true)}
        isOpenMobile={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
      />
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          fetchProducts();
          setIsMobileCartOpen(false);
        }}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={fetchProducts}
      />
    </div>
  );
};

export default OrderPage;
