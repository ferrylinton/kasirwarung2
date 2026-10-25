import React, { useState } from 'react';
import {
  FileQuestion,
  Home,
  ArrowLeft,
  Search,
  ShoppingCart,
  Package,
  History,
  Terminal,
  Settings,
  Store,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ActiveTab, TopNavbar } from '../components/TopNavbar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface NotFoundPageProps {
  onNavigate?: (tab: ActiveTab) => void;
  attemptedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  attemptedPath,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Determine current path attempted if not explicitly provided
  const currentPath =
    attemptedPath ||
    (typeof window !== 'undefined'
      ? window.location.hash.replace('#', '') || window.location.pathname
      : '/unknown');

  const handleCopyPath = () => {
    navigator.clipboard.writeText(currentPath || '404');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultHomeTab: ActiveTab = user?.role === 'ADMIN' ? 'tenants' : 'pos';

  // Navigation targets for quick jump
  const quickLinks: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    roles?: string[];
  }> = [
    {
      id: 'pos',
      label: 'Kasir & Penjualan (POS)',
      description: 'Halaman kasir transaksi harian dan keranjang',
      icon: <ShoppingCart className="w-5 h-5 text-orange-500" />,
      roles: ['CASHIER', 'SHOP_OWNER'],
    },
    {
      id: 'products',
      label: 'Katalog & Stok Produk',
      description: 'Kelola inventaris, barcode, dan harga barang',
      icon: <Package className="w-5 h-5 text-blue-500" />,
      roles: ['CASHIER', 'SHOP_OWNER'],
    },
    {
      id: 'admin-products',
      label: 'Semua Produk Tenan',
      description: 'Audit katalog produk dari semua warung/toko',
      icon: <Package className="w-5 h-5 text-indigo-500" />,
      roles: ['ADMIN'],
    },
    {
      id: 'tenants',
      label: 'Kelola Tenan Platform',
      description: 'Dashboard kelola toko terdaftar dan aktivasi',
      icon: <Store className="w-5 h-5 text-emerald-500" />,
      roles: ['ADMIN'],
    },
    {
      id: 'history',
      label: 'Riwayat Transaksi',
      description: 'Daftar struk, rekapan penjualan, dan status pembayaran',
      icon: <History className="w-5 h-5 text-purple-500" />,
      roles: ['CASHIER', 'SHOP_OWNER', 'ADMIN'],
    },
    {
      id: 'system-logs',
      label: 'Log Sistem Winston',
      description: 'Audit berkas log server harian dan inspeksi aktivitas',
      icon: <Terminal className="w-5 h-5 text-amber-500" />,
      roles: ['SHOP_OWNER', 'ADMIN'],
    },
    {
      id: 'store-settings',
      label: 'Pengaturan Toko',
      description: 'Konfigurasi nama toko, struk, dan pajak',
      icon: <Settings className="w-5 h-5 text-slate-500" />,
      roles: ['SHOP_OWNER'],
    },
  ];

  // Filter links accessible by user role
  const accessibleLinks = quickLinks.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  // Search filter
  const filteredLinks = accessibleLinks.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Top Navbar */}
      <TopNavbar currentTab="not-found" onNavigate={onNavigate} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col items-center">
        {/* Visual 404 Hero Container */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-10 flex flex-col items-center text-center">
          {/* Custom SVG Graphic */}
          <div className="relative mb-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-inner">
              <FileQuestion className="w-12 h-12 md:w-14 md:h-14 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md shadow-xs border border-slate-700">
              404
            </div>
          </div>

          {/* Typography Hierarchy */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-lg mb-6 leading-relaxed">
            Maaf, halaman atau rute yang Anda tuju tidak tersedia di sistem Kasir Warung.
            Alamat mungkin salah ketik, telah dipindahkan, atau rute belum terdaftar.
          </p>

          {/* Path diagnostic bar */}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 rounded-lg px-3.5 py-2 mb-8 max-w-md w-full text-xs font-mono text-slate-700">
            <span className="text-slate-400 select-none">Rute:</span>
            <span className="truncate flex-1 text-left font-semibold text-slate-800">
              {currentPath}
            </span>
            <button
              onClick={handleCopyPath}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
              title="Salin path rute"
              type="button"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
            <button
              onClick={() => onNavigate?.(defaultHomeTab)}
              type="button"
              className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>

            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  onNavigate?.(defaultHomeTab);
                }
              }}
              type="button"
              className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 active:text-slate-900 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Halaman Sebelumnya</span>
            </button>
          </div>
        </div>

        {/* Quick Directory / Navigation Hub */}
        <section className="w-full mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pintasan Menu Tersedia
              </h2>
              <p className="text-xs text-slate-500">
                Pilih menu yang ingin Anda tuju langsung di bawah ini
              </p>
            </div>

            {/* Quick search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu tujuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate?.(link.id)}
                type="button"
                className="group p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-orange-300 rounded-xl text-left transition-all shadow-2xs hover:shadow-xs flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-orange-50 transition-colors shrink-0">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                      {link.label}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {link.description}
                  </p>
                </div>
              </button>
            ))}

            {filteredLinks.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-400 font-mono">
                Tidak ada menu yang sesuai dengan pencarian "{searchQuery}"
              </div>
            )}
          </div>
        </section>

        {/* Footer Help text */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Kasir Warung POS</span>
          <span aria-hidden="true">·</span>
          <span>Bantuan Teknis: Periksa berkas log sistem atau hubungi Administrator</span>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
