import React, { useState, useEffect, useCallback } from 'react';
import { TopHeader } from '../components/TopHeader.tsx';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { SavedOrdersBar } from '../components/SavedOrdersBar.tsx';
import { CategorySelect } from '../components/CategorySelect.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { OrderDrawer } from '../components/OrderDrawer.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import { ShiftModal } from '../components/ShiftModal.tsx';
import { Product, api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PackagePlus, RefreshCcw } from 'lucide-react';

const CATEGORIES = [
  'Semua Produk',
  'Makanan Instan',
  'Minuman',
  'Sembako',
  'Camilan',
  'Kebutuhan Rumah',
];

interface PosPageProps {
  onNavigate?: (tab: any) => void;
}

export const PosPage: React.FC<PosPageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Produk');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const { logout } = useAuth();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getProducts(searchQuery, selectedCategory);
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Load products note:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      {/* Top Navbar with breadcrumb on left & tablet/mobile cart button with badge on right */}
      <TopNavbar
        currentTab="pos"
        onNavigate={onNavigate}
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Center Main POS Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-7">
          {/* Top Header */}
          <TopHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSwitchCashier={() => setIsShiftModalOpen(true)}
          />

        {/* Section: PESANAN DISIMPAN (BELUM DIBAYAR) */}
        <SavedOrdersBar onOpenAllSaved={() => onNavigate?.('history')} />

        {/* Section: Kategori Produk & Radix Select Filter */}
        <div className="flex items-center justify-between gap-3 mb-4 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold text-base">📦</span>
            <span className="text-xs md:text-sm font-bold text-slate-800">
              Kategori Produk:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CategorySelect
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              categories={CATEGORIES}
            />
            <button
              onClick={() => onNavigate?.('products')}
              title="Buka Halaman Inventaris Produk"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              Tidak ada produk ditemukan
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Coba kata kunci lain atau tambahkan produk baru.
            </p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-600 rounded-lg flex items-center gap-1.5 hover:bg-orange-100"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-20 lg:pb-6">
            {products.map((product) => (
              <ProductCard key={product.id || product.sku} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Right Drawer: Order Cart */}
      <OrderDrawer
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

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onLogout={logout}
      />
    </div>
  );
};
