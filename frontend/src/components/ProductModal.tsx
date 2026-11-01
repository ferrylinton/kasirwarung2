import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Save, Shield } from 'lucide-react';
import { Product, Category, SHOP_OWNER } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCategories, useProductMutations } from '../hooks/useQueries.ts';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialProduct?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialProduct,
}) => {
  const { user } = useAuth();
  const isShopOwner = user?.role === SHOP_OWNER;

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Makanan Instan');
  const [price, setPrice] = useState(initialProduct?.price || 5000);
  const [stock, setStock] = useState(initialProduct?.stock || 20);
  const [iconType, setIconType] = useState(initialProduct?.iconType || 'box');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // TanStack Query for categories
  const { data: categoriesData } = useCategories(undefined, { enabled: isOpen });
  const categories = categoriesData?.data || [];

  // TanStack Mutations for product
  const { createProduct, updateProduct } = useProductMutations();

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (categories.length > 0 && !initialProduct && !categories.some((c) => c.name === category)) {
        setCategory(categories[0].name);
      }
    }
  }, [isOpen, initialProduct, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShopOwner) {
      setError('Hanya role SHOP_OWNER yang bisa menambah atau mengubah data produk.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (initialProduct?.id) {
        await updateProduct.mutateAsync({
          id: initialProduct.id,
          data: {
            name,
            category,
            price: Number(price),
            stock: Number(stock),
          },
        });
      } else {
        await createProduct.mutateAsync({
          name,
          sku: sku || `KW-${Date.now().toString().slice(-4)}`,
          category,
          price: Number(price),
          stock: Number(stock),
          iconType,
          bgTint: '#FDF8EE',
          iconColor: '#F59E0B',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-[var(--border-default)] text-[var(--text-primary)] transition-colors duration-200">
        <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-table-header)]">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-[var(--text-primary)] text-base md:text-lg">
              {initialProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isShopOwner && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Hanya Lihat: Hanya role SHOP_OWNER yang bisa menambah atau mengubah data produk.</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              required
              disabled={!isShopOwner}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Indomie Goreng Spesial"
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Kategori
              </label>
              <select
                value={category}
                disabled={!isShopOwner}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)]"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id || c.name} value={c.name} className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Makanan Instan" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">🍜 Makanan Instan</option>
                    <option value="Minuman" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">🥤 Minuman</option>
                    <option value="Sembako" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">🌾 Sembako</option>
                    <option value="Camilan" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">🍿 Camilan</option>
                    <option value="Kebutuhan Rumah" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">🧼 Kebutuhan Rumah</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="KW-001"
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Tipe Ikon Produk
            </label>
            <select
              value={iconType}
              onChange={(e) => setIconType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="noodle" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Mie Instan (Indomie)</option>
              <option value="water" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Air Mineral (Aqua)</option>
              <option value="milk" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Susu (Ultra Milk)</option>
              <option value="oil" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Minyak Goreng (Sania)</option>
              <option value="chips" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Keripik / Snack (Chitato)</option>
              <option value="rice" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Beras (Ramos)</option>
              <option value="tea" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Teh (Sosro)</option>
              <option value="energy" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Minuman Energi (Pocari)</option>
              <option value="box" className="bg-[var(--bg-dropdown)] text-[var(--text-primary)]">Kotak Standar</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isShopOwner}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : !isShopOwner ? 'Hanya SHOP_OWNER' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
