import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Product, Tenant } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { useProducts, useTenants, useCategories } from '../hooks/useQueries.ts';
import { CategorySelect } from '../components/CategorySelect.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useAdminDrill } from '../context/AdminDrillContext.tsx';

export const AdminProductsPage: React.FC = () => {
  const { tenantId } = useAuth();
  const { adminDrillTenantId, adminDrillCategory } = useAdminDrill();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    adminDrillTenantId && adminDrillTenantId !== 'ALL' ? adminDrillTenantId : (tenantId || 'ALL')
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    adminDrillCategory || 'Semua Produk'
  );

  useEffect(() => {
    if (adminDrillTenantId && adminDrillTenantId !== 'ALL') {
      setSelectedTenantId(adminDrillTenantId);
    } else if (tenantId) {
      setSelectedTenantId(tenantId);
    }
  }, [adminDrillTenantId, tenantId]);

  useEffect(() => {
    if (adminDrillCategory) {
      setSelectedCategory(adminDrillCategory);
    }
  }, [adminDrillCategory]);

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <TopNavbar currentTab="admin-products" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Filters Bar: Tenant, Category, Search, Refresh */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors duration-200">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk berdasarkan nama atau SKU..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--border-default)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tenant Filter */}
              <TenantSelect
                value={selectedTenantId}
                onValueChange={(val) => setSelectedTenantId(val)}
                tenants={tenants}
                className="border-[var(--border-default)] focus:ring-purple-500/20 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />

              {/* Category Filter */}
              <CategorySelect
                value={selectedCategory}
                onValueChange={(val) => setSelectedCategory(val)}
                categories={categoryOptions}
                className="py-2 rounded-xl text-xs md:text-sm font-semibold border-[var(--border-default)] focus:ring-purple-500/20 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />

              {/* Refresh button */}
              <button
                onClick={() => { fetchProducts(); }}
                title="Segarkan Data"
                className="p-2 border border-[var(--border-default)] rounded-xl hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* All Products Inventory Table Card */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-default)] shadow-xs overflow-hidden transition-colors duration-200">
            <div className="p-4 md:p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-table-header)]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm md:text-base">
                  Daftar Produk Seluruh Tenan ({products.length})
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">Data Terpusat Platform Kasir</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="py-3 px-4">Tenan Toko</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-xs md:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                        Memuat data inventaris produk seluruh tenan...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                        Tidak ada produk yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLowStock = (p.stock || 0) < 15;
                      const isOutOfStock = (p.stock || 0) <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-[var(--bg-table-row-hover)] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                {p.tenantName || 'Warung Berkah'}
                              </span>
                              {p.tenantCode && (
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                  {p.tenantCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                style={{ backgroundColor: p.bgTint || '#FDF8EE' }}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs border border-slate-100 dark:border-slate-800"
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
                              <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--text-muted)]">
                            {p.sku || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)]">
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
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/60">
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                                Menipis
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/60">
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
