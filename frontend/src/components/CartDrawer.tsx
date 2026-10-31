import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Trash2,
  X,
  Banknote,
  ShoppingBag,
  ShieldAlert,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ProductIcon } from './ProductIcons.tsx';
import { ADMIN } from '../constants/roles.ts';

interface CartDrawerProps {
  onOpenPayment: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOpenPayment,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { t } = useTranslation();
  const {
    invoiceNo,
    items,
    subtotal,
    tax,
    taxEnabled,
    taxRate,
    taxType,
    total,
    removeItem,
    clearCart,
    saveCurrentOrder,
    isMobileCartOpen,
    closeMobileCart,
  } = useCart();

  const { user } = useAuth();
  const isAdmin = user?.role === ADMIN;

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
        className={`w-full lg:w-80 xl:w-96 bg-[var(--bg-surface)] dark:bg-slate-900 border-l border-[var(--border-default)] dark:border-slate-800 flex flex-col h-full shadow-xl lg:shadow-sm select-none transition-transform duration-200 text-[var(--text-primary)] ${
          isDrawerOpen
            ? 'fixed inset-y-0 right-0 z-50 max-w-sm flex'
            : 'hidden lg:flex'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold text-lg">📋</span>
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              {t('pos.cartTitle', 'Keranjang')}
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
                      ? t('pos.adminNoticeTitle', 'Role ADMIN tidak bisa bikin / simpan order')
                      : t('pos.saveOrderCTA', 'Simpan / Tunda Pesanan (Belum Dibayar)')
                  }
                  className="w-7 h-7 rounded-full bg-[var(--bg-muted)] hover:bg-orange-500/10 text-[var(--text-secondary)] hover:text-orange-600 dark:hover:text-orange-400 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-[var(--border-default)] dark:border-slate-800 animate-in fade-in zoom-in-95 focus:outline-none">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                    <Save className="w-5 h-5" />
                  </div>
                  <AlertDialog.Title className="text-base font-bold text-[var(--text-primary)]">
                    {t('pos.holdOrderTitle', 'Simpan Pesanan Sementara?')}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-xs md:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {t('pos.holdOrderDesc', 'Pesanan nota {{invoiceNo}} akan disimpan ke daftar Pesanan Sementara agar Anda dapat melayani pelanggan lain terlebih dahulu.', { invoiceNo })}
                  </AlertDialog.Description>
                  <div className="flex items-center justify-end gap-2.5 mt-5">
                    <AlertDialog.Cancel asChild>
                      <button
                        type="button"
                        className="px-3.5 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-xl transition-colors cursor-pointer"
                      >
                        {t('common.cancel', 'Batal')}
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        onClick={handleHoldOrder}
                        className="px-4 py-2 text-xs md:text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {t('pos.yesHoldOrder', 'Ya, Simpan Pesanan')}
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
                  title={t('pos.clearCartTitle', 'Kosongkan Keranjang')}
                  className="w-7 h-7 rounded-full bg-[var(--bg-muted)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-2xl z-50 w-[90vw] max-w-sm border border-[var(--border-default)] dark:border-slate-800 animate-in fade-in zoom-in-95 focus:outline-none">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <AlertDialog.Title className="text-base font-bold text-[var(--text-primary)]">
                    {t('pos.clearCartTitle', 'Kosongkan Keranjang?')}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-xs md:text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {t('pos.clearCartDesc', 'Semua item dalam nota pesanan ini akan dihapus dari keranjang. Aksi ini tidak dapat dibatalkan.')}
                  </AlertDialog.Description>
                  <div className="flex items-center justify-end gap-2.5 mt-5">
                    <AlertDialog.Cancel asChild>
                      <button
                        type="button"
                        className="px-3.5 py-2 text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-xl transition-colors cursor-pointer"
                      >
                        {t('common.cancel', 'Batal')}
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-4 py-2 text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {t('pos.yesClearCart', 'Ya, Kosongkan')}
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden w-7 h-7 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Invoice Bar */}
        <div className="px-4 py-2.5 bg-[var(--bg-subtle)] dark:bg-slate-800/40 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)] font-medium">{t('pos.invoiceNo', 'No. Nota')}:</span>
          <span className="font-mono font-bold text-[var(--text-primary)] tracking-wider">
            {invoiceNo}
          </span>
        </div>

        {/* Cart Items List */}
        <div className="overflow-y-auto p-4 divide-y divide-[var(--border-subtle)] space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[var(--text-muted)]">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-2 text-[var(--text-subtle)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('pos.emptyCart', 'Keranjang Masih Kosong')}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px]">
                {t('pos.emptyCartHelp', 'Klik tombol (+) pada kartu produk di sebelah kiri untuk menambahkan.')}
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 dark:brightness-90"
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
                      className="text-xs font-semibold text-[var(--text-primary)] truncate"
                    >
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium tabular-nums">
                      x{item.qty} @Rp{item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Price & Delete Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs md:text-sm font-bold text-[var(--text-primary)] tabular-nums">
                    Rp{(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    title={t('common.delete', 'Hapus produk')}
                    className="text-[var(--text-subtle)] hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Pay CTA */}
        <div className="p-4 border-t border-[var(--border-default)] dark:border-slate-800 bg-[var(--bg-surface)] dark:bg-slate-900 space-y-3">
          <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between">
              <span>{t('pos.subtotalItems', 'Subtotal Item')} ({items.length} {t('common.products', 'produk')})</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                Rp{subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>
                {taxEnabled
                  ? taxType === 'percentage'
                    ? t('pos.ppnActive', 'PPN ({{rate}}%)', { rate: taxRate })
                    : t('pos.ppnFixed', 'PPN (Rp{{amount}})', { amount: taxRate.toLocaleString('id-ID') })
                  : t('pos.ppnInactive', 'PPN (Nonaktif)')}
              </span>
              <span className={`font-semibold tabular-nums ${taxEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'}`}>
                Rp{tax.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-baseline justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {t('pos.totalPayment', 'Total Pembayaran')}
            </span>
            <span className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight tabular-nums">
              Rp{total.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Large Pay Button or ADMIN notice */}
          {isAdmin ? (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-xs md:text-sm">
                <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{t('pos.adminNoticeTitle', 'Role ADMIN Tidak Bisa Bikin Order')}</span>
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 leading-snug">
                {t('pos.adminNoticeDesc', 'Role ADMIN hanya bertugas mengelola platform dan tenan. Transaksi kasir hanya dapat dibuat oleh Kasir (SHOP_CASHIER) atau Pemilik Toko (SHOP_OWNER).')}
              </p>
            </div>
          ) : (
            <button
              onClick={onOpenPayment}
              disabled={items.length === 0}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Banknote className="w-4 h-4 stroke-[2.2]" />
              <span>{t('pos.payButton', 'Bayar')}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
