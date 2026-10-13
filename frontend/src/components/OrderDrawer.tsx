import React from 'react';
import {
  FileText,
  Pause,
  Trash2,
  Calculator,
  X,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { ProductIcon } from './ProductIcons.tsx';

interface OrderDrawerProps {
  onOpenPayment: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  onOpenPayment,
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    invoiceNo,
    items,
    subtotal,
    tax,
    total,
    removeItem,
    clearCart,
    saveCurrentOrder,
    isMobileCartOpen,
    closeMobileCart,
  } = useCart();

  const isDrawerOpen = isOpenMobile !== undefined ? isOpenMobile : isMobileCartOpen;
  const handleClose = onCloseMobile || closeMobileCart;

  const handleHoldOrder = async () => {
    if (items.length === 0) return;
    const ok = await saveCurrentOrder();
    if (ok) {
      handleClose();
    }
  };

  const handleClear = () => {
    if (items.length > 0) {
      clearCart();
    }
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
        />
      )}

      <div
        className={`w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl lg:shadow-sm select-none transition-transform duration-200 ${
          isDrawerOpen
            ? 'fixed inset-y-0 right-0 z-50 max-w-sm flex'
            : 'hidden lg:flex'
        }`}
      >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-lg">📋</span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Pesanan
          </h2>
        </div>

        {/* Action icons: Pause (Hold order), Trash (Clear cart), Close for mobile */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleHoldOrder}
            disabled={items.length === 0}
            title="Simpan / Tunda Pesanan (Belum Dibayar)"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={handleClear}
            disabled={items.length === 0}
            title="Kosongkan Keranjang"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Invoice Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">No. Nota:</span>
        <span className="font-mono font-bold text-slate-800 tracking-wider">
          {invoiceNo}
        </span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Klik tombol (+) pada kartu produk di sebelah kiri untuk menambahkan.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId || item.name}
              className="pt-2 first:pt-0 flex items-center justify-between gap-3 group"
            >
              {/* Product Icon & Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bgTint || '#FDF8EE' }}
                >
                  <ProductIcon
                    type={item.iconType || 'box'}
                    color={item.iconColor}
                    className="w-6 h-6"
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    title={item.name}
                    className="text-xs font-semibold text-slate-800 truncate"
                  >
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium tabular-nums">
                    x{item.qty} @Rp{item.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Price & Delete Button */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs md:text-sm font-bold text-slate-900 tabular-nums">
                  Rp{(item.price * item.qty).toLocaleString('id-ID')}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  title="Hapus produk"
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Pay CTA */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-3">
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal Item ({items.length} produk)</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              Rp{subtotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>PPN (11%)</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              Rp{tax.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Total Pembayaran
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            Rp{total.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Large Green Pay Button */}
        <button
          onClick={onOpenPayment}
          disabled={items.length === 0}
          className="w-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <CreditCard className="w-4 h-4 stroke-[2.5]" />
          <span>Bayar</span>
        </button>
      </div>
    </div>
  </>
);
};
