import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  FileText,
  Save,
  Trash2,
  Calculator,
  X,
  Banknote,
  ShoppingBag,
  ShieldAlert,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
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

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isDrawerOpen = isOpenMobile !== undefined ? isOpenMobile : isMobileCartOpen;
  const handleClose = onCloseMobile || closeMobileCart;

  const handleHoldOrder = async () => {
    if (items.length === 0 || isAdmin) return;
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

        {/* Action icons with Radix Alert Dialog confirmation: Save (Hold order), Trash (Clear cart) */}
        <div className="flex items-center gap-1.5">
          {/* Pause / Hold order confirmation dialog */}
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button
                type="button"
                disabled={items.length === 0 || isAdmin}
                title={
                  isAdmin
                    ? 'Role ADMIN tidak bisa bikin / simpan order'
                    : 'Simpan / Tunda Pesanan (Belum Dibayar)'
                }
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 animate-in fade-in zoom-in-95 focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                  <Save className="w-5 h-5" />
                </div>
                <AlertDialog.Title className="text-base font-bold text-slate-900">
                  Simpan Pesanan Sementara?
                </AlertDialog.Title>
                <AlertDialog.Description className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Pesanan nota <span className="font-mono font-semibold text-slate-800">{invoiceNo}</span> akan disimpan ke daftar 'Pesanan Sementara' (belum dibayar) agar Anda dapat melayani pelanggan lain terlebih dahulu.
                </AlertDialog.Description>
                <div className="flex items-center justify-end gap-2.5 mt-5">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={handleHoldOrder}
                      className="px-4 py-2 text-xs md:text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Ya, Simpan Pesanan
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>

          {/* Clear cart confirmation dialog */}
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button
                type="button"
                disabled={items.length === 0}
                title="Kosongkan Keranjang"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-slate-200 animate-in fade-in zoom-in-95 focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5" />
                </div>
                <AlertDialog.Title className="text-base font-bold text-slate-900">
                  Kosongkan Keranjang?
                </AlertDialog.Title>
                <AlertDialog.Description className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Semua item ({items.length} item) dalam nota pesanan ini akan dihapus dari keranjang. Aksi ini tidak dapat dibatalkan.
                </AlertDialog.Description>
                <div className="flex items-center justify-end gap-2.5 mt-5">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Ya, Kosongkan
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
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
      <div className="overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
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

        {/* Large Pay Button or ADMIN notice */}
        {isAdmin ? (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-purple-900 font-bold text-xs md:text-sm">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Role ADMIN Tidak Bisa Bikin Order</span>
            </div>
            <p className="text-[11px] text-purple-700 leading-snug">
              Role ADMIN hanya bertugas mengelola platform dan tenan. Transaksi penjualan kasir hanya dapat dibuat oleh Kasir (SHOP_CASHIER) atau Pemilik Toko (SHOP_OWNER).
            </p>
          </div>
        ) : (
          <button
            onClick={onOpenPayment}
            disabled={items.length === 0}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Banknote className="w-4 h-4 stroke-[2.2]" />
            <span>Bayar</span>
          </button>
        )}
      </div>
    </div>
  </>
);
};
