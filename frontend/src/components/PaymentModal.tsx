import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Banknote,
  Send,
  Printer,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ADMIN } from '../constants/roles.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { invoiceNo, items, total, customerName, setCustomerName, startNewTransaction } = useCart();
  const [cashAmount, setCashAmount] = useState<number>(total);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');

  if (!isOpen) return null;

  const changeAmount = Math.max(0, cashAmount - total);
  const isCashSufficient = cashAmount >= total;

  const quickNominals = [
    { label: t('payment.exactMoney', 'Uang Pas'), amount: total },
    { label: 'Rp50.000', amount: 50000 },
    { label: 'Rp100.000', amount: 100000 },
    { label: 'Rp150.000', amount: 150000 },
    { label: 'Rp200.000', amount: 200000 },
  ].filter((q) => q.amount >= total || q.label === t('payment.exactMoney', 'Uang Pas'));

  const handlePay = async () => {
    if (user?.role === ADMIN) {
      setPaymentError(t('pos.adminNoticeDesc', 'Role ADMIN tidak bisa bikin order. Hanya kasir atau pemilik toko yang dapat memproses transaksi.'));
      return;
    }
    if (!isCashSufficient) return;
    setPaymentError('');
    setLoading(true);
    try {
      const res = await api.createOrSaveOrder({
        invoiceNo,
        status: 'paid',
        items,
        customerName: customerName || t('pos.customerName', 'Pelanggan Umum'),
        customerEmail: customerEmail.trim() || undefined,
        cashReceived: cashAmount,
      });

      if (res.success && res.data) {
        setSuccessOrder(res.data);
      }
    } catch (err: any) {
      setPaymentError(err.message || t('common.error', 'Pembayaran gagal diproses'));
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    startNewTransaction();
    onSuccess();
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-[var(--bg-surface)] dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[var(--border-default)] dark:border-slate-800 text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-bold text-[var(--text-primary)] text-base md:text-lg">
              {successOrder ? t('payment.successTitle', 'Transaksi Sukses') : t('payment.modalTitle', 'Pembayaran Kasir')}
            </h3>
          </div>
          {!successOrder && (
            <button
              onClick={onClose}
              className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        {successOrder ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-[var(--text-primary)]">
                {t('payment.successTitle', 'Pembayaran Berhasil!')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                {successOrder.invoiceNo}
              </p>
            </div>

            <div className="bg-[var(--bg-subtle)] dark:bg-slate-800/60 rounded-2xl p-4 text-left space-y-2 text-xs md:text-sm border border-[var(--border-subtle)]">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>{t('payment.customerBill', 'Total Belanja:')}</span>
                <span className="font-bold text-[var(--text-primary)] tabular-nums">
                  Rp{successOrder.total.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>{t('payment.cashGot', 'Uang Diterima:')}</span>
                <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                  Rp{successOrder.cashReceived?.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-[var(--border-subtle)] pt-2">
                <span>{t('payment.changeReturn', 'Kembalian:')}</span>
                <span className="tabular-nums">
                  Rp{successOrder.changeAmount?.toLocaleString('id-ID')}
                </span>
              </div>
              {successOrder.emailStatus && (
                <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 rounded-lg">
                  📧 {successOrder.emailStatus.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 border border-[var(--border-default)] dark:border-slate-700 hover:bg-[var(--bg-muted)] rounded-xl text-xs md:text-sm font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('payment.printReceipt', 'Cetak Nota')}</span>
              </button>
              <button
                onClick={handleDone}
                className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {t('payment.newTransaction', 'Transaksi Baru')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {paymentError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold">
                {paymentError}
              </div>
            )}

            {/* Amount Banner */}
            <div className="bg-orange-500/10 rounded-2xl p-4 flex items-center justify-between border border-orange-500/30">
              <div>
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                  {t('payment.totalBill', 'Total Tagihan')}
                </span>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  {invoiceNo} ({items.length} {t('common.items', 'item')})
                </p>
              </div>
              <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                Rp{total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Cash details */}
            <div className="space-y-3">
              {/* Quick nominal buttons */}
              <div>
                <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  {t('payment.quickNominal', 'Nominal Cepat')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickNominals.map((nom) => (
                    <button
                      key={nom.label}
                      type="button"
                      onClick={() => setCashAmount(nom.amount)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        cashAmount === nom.amount
                          ? 'bg-[#EC6C1A] text-white border-[#EC6C1A]'
                          : 'bg-[var(--bg-muted)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-[var(--border-default)] dark:border-slate-700'
                      }`}
                    >
                      {nom.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input & change */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('payment.cashReceived', 'Uang Tunai Diterima (Rp)')}
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-slate-700 rounded-xl text-sm font-bold bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('payment.changeAmount', 'Kembalian (Rp)')}
                  </label>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm font-bold border ${
                      changeAmount >= 0 && cashAmount >= total
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}
                  >
                    {cashAmount >= total
                      ? `Rp${changeAmount.toLocaleString('id-ID')}`
                      : t('payment.insufficientCash', 'Uang Kurang!')}
                  </div>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('pos.customerName', 'Nama Pelanggan (opsional)')}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('pos.customerName', 'Pelanggan Umum')}
                    className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-slate-700 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('pos.customerEmail', 'Email Pelanggan (opsional untuk nota digital)')}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="pelanggan@gmail.com"
                    className="w-full px-3 py-2 border border-[var(--border-default)] dark:border-slate-700 rounded-xl text-xs md:text-sm bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer / Action CTA */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Batal')}
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={!isCashSufficient || loading}
                className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('payment.processing', 'Memproses...')}</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4 stroke-[2.2]" />
                    <span>{t('payment.processPayment', 'Proses Pembayaran')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
