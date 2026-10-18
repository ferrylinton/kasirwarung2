import React, { useState } from 'react';
import {
  Tags,
  Search,
  Building2,
  RefreshCw,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Category, Tenant } from '../services/api.ts';
import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { useCategories, useTenants } from '../hooks/useQueries.ts';

interface AdminCategoriesPageProps {
  onNavigate?: (tab: ActiveTab) => void;
  onFilterTenantProducts?: (tenantId: string, categoryName: string) => void;
}

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({
  onNavigate,
  onFilterTenantProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('ALL');

  // TanStack Query for tenants
  const { data: tenantsData } = useTenants();
  const tenants = tenantsData?.data || [];

  // TanStack Query for categories
  const {
    data: categoriesData,
    isLoading: loading,
    refetch: fetchCategories,
  } = useCategories(selectedTenantId);
  const categories = categoriesData?.data || [];

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.tenantName && c.tenantName.toLowerCase().includes(q))
    );
  });

  const totalCategories = categories.length;
  const totalProductsCount = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const uniqueTenantsWithCats = new Set(categories.map((c) => c.tenantId).filter(Boolean)).size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopNavbar currentTab="admin-categories" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
                <Tags className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Semua Kategori Tenan
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200/80">
                    Mode Administrator
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Monitoring struktur kategori produk dari seluruh tenan platform untuk memastikan tata kelola katalog warung.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => { fetchCategories(); }}
                disabled={loading}
                title="Muat Ulang Kategori"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>

              <button
                onClick={() => onNavigate?.('admin-products')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Lihat Semua Produk Tenan</span>
              </button>
            </div>
          </div>

          {/* Role Disclaimer Notice */}
          <div className="p-4 bg-purple-50/70 border border-purple-200/70 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900">
                Akses Monitoring Global Kategori (Read-Only)
              </p>
              <p className="text-purple-700 text-[11px] mt-0.5">
                Role ADMIN bertugas mengawasi struktur katalog kategori lintas tenan. Pembuatan, pengubahan, dan penghapusan kategori hanya dapat dilakukan oleh akun Pemilik Toko (SHOP_OWNER) masing-masing.
              </p>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Kategori Platform
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                {totalCategories} Kategori
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Tersebar di seluruh tenan
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Produk Terkategori
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-indigo-600 mt-1">
                {totalProductsCount} Produk
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Item yang terasosiasi ke kategori
              </p>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tenan dengan Kategori
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-purple-700 mt-1">
                {uniqueTenantsWithCats} Tenan
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                Dari total {tenants.length} tenan terdaftar
              </p>
            </div>
          </div>

          {/* Filters Bar: Tenant Dropdown & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari kategori produk berdasarkan nama atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
              />
            </div>

            {/* Tenant Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">🏢 Semua Tenan ({tenants.length})</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white rounded-3xl border border-slate-200/60 p-5 animate-pulse space-y-3"
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Tags className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori di Tenan Ini'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada kategori yang cocok dengan pencarian Anda. Silakan coba kata kunci lain.'
                  : 'Belum ada kategori produk yang terdaftar untuk tenan yang dipilih.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Tenant Badge Header */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200/60 truncate max-w-[200px]">
                        <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{category.tenantName || 'Warung Utama'}</span>
                      </span>
                      {category.tenantCode && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {category.tenantCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs border border-black/5"
                          style={{ backgroundColor: `${category.color || '#F59E0B'}18` }}
                        >
                          {category.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
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
                        if (onFilterTenantProducts && category.tenantId) {
                          onFilterTenantProducts(category.tenantId, category.name);
                        } else if (onNavigate) {
                          onNavigate('admin-products');
                        }
                      }}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Lihat Produk Tenan Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[11px] font-semibold text-slate-400">
                      ID: {category.id.slice(-4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCategoriesPage;
