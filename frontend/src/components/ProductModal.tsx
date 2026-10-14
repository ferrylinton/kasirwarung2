import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Save, Shield } from 'lucide-react';
import { Product, Category, api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

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
  const isShopOwner = user?.role === 'SHOP_OWNER' || user?.role === 'pemilik';

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Makanan Instan');
  const [categories, setCategories] = useState<Category[]>([]);
  const [price, setPrice] = useState(initialProduct?.price || 5000);
  const [stock, setStock] = useState(initialProduct?.stock || 20);
  const [iconType, setIconType] = useState(initialProduct?.iconType || 'box');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          if (!initialProduct && !res.data.some((c: any) => c.name === category)) {
            setCategory(res.data[0].name);
          }
        }
      }).catch((err) => console.warn('Could not load categories in modal:', err));
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShopOwner) {
      alert('Hanya role SHOP_OWNER yang bisa menambah atau mengubah data produk.');
      return;
    }
    setLoading(true);
    try {
      if (initialProduct?.id) {
        await api.updateProduct(initialProduct.id, {
          name,
          category,
          price: Number(price),
          stock: Number(stock),
        });
      } else {
        await api.createProduct({
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
      alert(err.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-base md:text-lg">
              {initialProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Indomie Goreng Spesial"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="Makanan Instan">Makanan Instan</option>
                <option value="Minuman">Minuman</option>
                <option value="Sembako">Sembako</option>
                <option value="Camilan">Camilan</option>
                <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="KW-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipe Ikon Produk
            </label>
            <select
              value={iconType}
              onChange={(e) => setIconType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="noodle">Mie Instan (Indomie)</option>
              <option value="water">Air Mineral (Aqua)</option>
              <option value="milk">Susu (Ultra Milk)</option>
              <option value="oil">Minyak Goreng (Sania)</option>
              <option value="chips">Keripik / Snack (Chitato)</option>
              <option value="rice">Beras (Ramos)</option>
              <option value="tea">Teh (Sosro)</option>
              <option value="energy">Minuman Energi (Pocari)</option>
              <option value="box">Kotak Standar</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EC6C1A] hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
