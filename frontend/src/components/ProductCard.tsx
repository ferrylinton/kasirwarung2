import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Product } from '../services/api.ts';
import { ProductIcon } from './ProductIcons.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { findItemQty, addItem, setItemQty } = useCart();
  const qty = findItemQty(product.id) || findItemQty(product.sku) || findItemQty(product.name);
  const isInCart = qty > 0;

  return (
    <div
      className={`relative bg-white rounded-2xl p-3 flex flex-col justify-between transition-all select-none ${
        isInCart
          ? 'ring-2 ring-[#16A34A] shadow-xs'
          : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Illustration Card Container with Pastel Tint */}
      <div
        className="w-full h-28 md:h-32 rounded-xl relative flex items-center justify-center p-2 mb-2.5 transition-colors overflow-hidden"
        style={{ backgroundColor: product.bgTint || '#FDF8EE' }}
      >
        {/* Top-left Stock Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs ${
              isInCart ? 'bg-[#10B981]' : 'bg-[#1E293B]'
            }`}
          >
            Stok: {product.stock}
          </span>
        </div>

        {/* Center Product Illustration / Icon */}
        <div className="transform transition-transform hover:scale-105">
          <ProductIcon
            type={product.iconType}
            color={product.iconColor}
            className="w-14 h-14 md:w-16 md:h-16 drop-shadow-xs"
          />
        </div>
      </div>

      {/* Product Name */}
      <div className="mb-2">
        <h3
          title={product.name}
          className="text-xs md:text-sm font-semibold text-slate-800 truncate"
        >
          {product.name}
        </h3>
      </div>

      {/* Price & Quantity Stepper */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <span className="font-bold text-xs md:text-sm text-slate-900 tabular-nums">
          Rp{product.price.toLocaleString('id-ID')}
        </span>

        {/* Stepper (-  qty  +) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => !isAdmin && addItem(product, -1)}
            disabled={qty <= 0 || isAdmin}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
              qty > 0 && !isAdmin
                ? 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title={isAdmin ? 'Role ADMIN tidak bisa bikin order' : 'Kurangi jumlah'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span
            className={`text-xs md:text-sm font-bold min-w-[16px] text-center tabular-nums ${
              isInCart ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            {qty}
          </span>

          <button
            onClick={() => !isAdmin && addItem(product, 1)}
            disabled={isAdmin}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
              isAdmin
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                : isInCart
                ? 'bg-[#16A34A] text-white hover:bg-[#15803D] active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}
            title={isAdmin ? 'Role ADMIN tidak bisa bikin order' : 'Tambah jumlah'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
