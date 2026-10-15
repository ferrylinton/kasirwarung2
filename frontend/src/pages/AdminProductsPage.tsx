import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Building2,
  TrendingUp,
  RefreshCw,
  Layers,
  Store,
  ShieldAlert,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { Product, Tenant, api } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';

interface AdminProductsPageProps {
  onNavigate?: (tab: ActiveTab) => void;
  initialTenantId?: string;
  initialCategory?: string;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  onNavigate,
  initialTenantId = 'ALL',
  initialCategory = 'Semua Produk',
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Load list of all tenants for filter dropdown
  useEffect(() => {
    api.getTenants()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTenants(res.data);
        }
      })
      .catch((err) => console.warn('Could not load tenants:', err));
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getProducts(searchQuery, selectedCategory, selectedTenantId);
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);

        // Collect unique categories across loaded products
        const uniqueCats = Array.from(
          new Set(res.data.map((p: Product) => p.category).filter(Boolean))
        ) as string[];
        setAllCategories(uniqueCats);
      }
    } catch (err) {
      console.warn('Load admin products error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedTenantId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Statistics calculation across all tenants
  const totalSku = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const uniqueTenantsCount = new Set(products.map((p) => p.tenantId).filter(Boolean)).size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopNavbar currentTab="admin-products" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Banner for Admin */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Semua Produk Tenan
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200/80">
                    Mode Administrator
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Monitoring seluruh produk, SKU, harga, dan sisa stok barang dari semua tenan warung/toko terdaftar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => onNavigate?.('admin-categories')}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs md:text-sm flex items-center gap-2 border border-purple-200/60 transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Lihat Semua Kategori Tenan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Role Disclaimer Notice */}
          <div className="p-4 bg-purple-50/70 border border-purple-200/70 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900">
                Akses Monitoring Global Platform (Read-Only)
              </p>
              <p className="text-purple-700 text-[11px] mt-0.5">
                Role ADMIN memiliki wewenang memantau data inventaris seluruh tenan. Hak menambah, mengubah, dan menghapus produk dipegang secara independen oleh masing-masing Pemilik Toko (SHOP_OWNER).
              </p>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Macam Produk
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                {totalSku} SKU
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-purple-600" />
                Semua tenan aktif
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Fisik Stok
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                {totalStock.toLocaleString('id-ID')} pcs
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                Akumulasi seluruh gudang
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Estimasi Nilai Inventaris
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-emerald-600 tabular-nums mt-1">
                Rp{totalValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Nilai jual seluruh barang
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tenan dengan Produk
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-purple-700 mt-1">
                {uniqueTenantsCount} Tenan
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                Dari total {tenants.length} tenan terdaftar
              </p>
            </div>
          </div>

          {/* Filters Bar: Tenant, Category, Search, Refresh */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk berdasarkan nama atau SKU..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tenant Filter */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  <option value="ALL">🏢 Semua Tenan ({tenants.length})</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="Semua Produk">Semua Kategori</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Refresh button */}
              <button
                onClick={fetchProducts}
                title="Segarkan Data"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* All Products Inventory Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Produk Seluruh Tenan ({products.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Data Terpusat Platform Kasir</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tenan Toko</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Memuat data inventaris produk seluruh tenan...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada produk yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLowStock = (p.stock || 0) < 15;
                      const isOutOfStock = (p.stock || 0) <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-purple-900 text-xs flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-purple-600" />
                                {p.tenantName || 'Warung Berkah'}
                              </span>
                              {p.tenantCode && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  {p.tenantCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                style={{ backgroundColor: p.bgTint || '#FDF8EE' }}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs border border-slate-100"
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
