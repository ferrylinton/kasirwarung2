import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Product, api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { ProductModal } from '../components/ProductModal.tsx';

interface ProductsPageProps {
  onBackToPos: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

const CATEGORIES = [
  'Semua Produk',
  'Makanan Instan',
  'Minuman',
  'Sembako',
  'Camilan',
  'Kebutuhan Rumah',
];

export const ProductsPage: React.FC<ProductsPageProps> = ({ onBackToPos, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Produk');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  // Statistics calculation
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) < 15).length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleQuickAddStock = async (p: Product, amount: number) => {
    try {
      const nextStock = (p.stock || 0) + amount;
      await api.updateProduct(p.id, { stock: nextStock });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Gagal menambah stok');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="products" onNavigate={onNavigate} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Top Actions & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={onBackToPos}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 hover:text-orange-600 bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs transition-all self-start cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Kasir POS</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#EC6C1A] hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* Title Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Katalog & Inventaris Produk
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Kelola daftar barang dagangan warung, pantau sisa stok barang, dan perbarui harga jual secara langsung.
            </p>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Macam Produk
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                {totalProducts} SKU
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Semua kategori warung
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Fisik Barang
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                {totalStock} pcs
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-green-500" />
                Siap untuk dijual
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Estimasi Nilai Stok
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-[#16A34A] tabular-nums mt-1">
                Rp{totalValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                Nilai jual inventaris
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Stok Menipis (&lt;15)
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-amber-600 mt-1">
                {lowStockCount} Item
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Perlu restock segera
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama produk atau SKU..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50/50"
              />
            </div>

            {/* Category Select Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchProducts}
                title="Segarkan Data"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Products Inventory Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Barang Dagangan ({products.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Inventaris Kasir Warung</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Memuat data inventaris produk...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada produk yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLowStock = (p.stock || 0) < 15;
                      const isOutOfStock = (p.stock || 0) <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                style={{ backgroundColor: p.bgTint || '#FDF8EE' }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs border border-slate-100"
                              >
                                {p.iconType === 'noodle' && '🍜'}
                                {p.iconType === 'water' && '💧'}
                                {p.iconType === 'milk' && '🥛'}
                                {p.iconType === 'oil' && '🍾'}
                                {p.iconType === 'chips' && '🥔'}
                                {p.iconType === 'rice' && '🌾'}
                                {p.iconType === 'tea' && '🍵'}
                                {p.iconType === 'energy' && '⚡'}
                                {!['noodle', 'water', 'milk', 'oil', 'chips', 'rice', 'tea', 'energy'].includes(
                                  p.iconType
                                ) && '📦'}
                              </div>
                              <span className="font-bold text-slate-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                            {p.sku || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                            Rp{p.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                            {p.stock} pcs
                          </td>
                          <td className="py-3.5 px-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Menipis
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                Tersedia
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleQuickAddStock(p, 10)}
                                title="Tambah Stok Cepat (+10 pcs)"
                                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="Ubah Data Produk"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
