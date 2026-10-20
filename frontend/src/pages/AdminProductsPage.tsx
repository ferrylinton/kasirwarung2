import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Product, Tenant } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { useProducts, useTenants, useCategories } from '../hooks/useQueries.ts';
import { CategorySelect } from '../components/CategorySelect.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // TanStack Query for tenants dropdown
  const { data: tenantsData } = useTenants();
  const tenants = tenantsData?.data || [];

  // TanStack Query for products across tenants
  const {
    data: productsData,
    isLoading: loading,
    refetch: fetchProducts,
  } = useProducts(searchQuery, selectedCategory, selectedTenantId);
  const products = productsData?.data || [];

  // TanStack Query for categories
  const { data: categoriesData } = useCategories(
    selectedTenantId === 'ALL' ? undefined : selectedTenantId
  );
  const categoriesList = categoriesData?.data || [];

  // Collect unique categories across categories list and loaded products
  const categoryOptions = useMemo(() => {
    const list = ['Semua Produk'];
    const added = new Set<string>(['Semua Produk']);

    categoriesList.forEach((c) => {
      if (c.name && !added.has(c.name)) {
        added.add(c.name);
        list.push(c.name);
      }
    });

    products.forEach((p: Product) => {
      if (p.category && !added.has(p.category)) {
        added.add(p.category);
        list.push(p.category);
      }
    });

    return list;
  }, [categoriesList, products]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopNavbar currentTab="admin-products" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

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
              <TenantSelect
                value={selectedTenantId}
                onValueChange={(val) => setSelectedTenantId(val)}
                tenants={tenants}
                className="border-slate-200 focus:ring-purple-500/20"
              />

              {/* Category Filter */}
              <CategorySelect
                value={selectedCategory}
                onValueChange={(val) => setSelectedCategory(val)}
                categories={categoryOptions}
                className="py-2 rounded-xl text-xs md:text-sm font-semibold border-slate-200 focus:ring-purple-500/20"
              />

              {/* Refresh button */}
              <button
                onClick={() => { fetchProducts(); }}
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

export default AdminProductsPage;
