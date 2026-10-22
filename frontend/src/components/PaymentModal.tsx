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
    if (user?.role === 'ADMIN') {
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
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-base md:text-lg">
              {successOrder ? t('payment.successTitle', 'Transaksi Sukses') : t('payment.modalTitle', 'Pembayaran Kasir')}
            </h3>
          </div>
          {!successOrder && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        {successOrder ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">
                {t('payment.successTitle', 'Pembayaran Berhasil!')}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {successOrder.invoiceNo}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs md:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t('payment.customerBill', 'Total Belanja:')}</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  Rp{successOrder.total.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('payment.cashGot', 'Uang Diterima:')}</span>
                <span className="tabular-nums font-semibold">
                  Rp{successOrder.cashReceived?.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-green-700 font-bold border-t border-slate-200 pt-2">
                <span>{t('payment.changeReturn', 'Kembalian:')}</span>
                <span className="tabular-nums">
                  Rp{successOrder.changeAmount?.toLocaleString('id-ID')}
                </span>
              </div>
              {successOrder.emailStatus && (
                <div className="mt-2 text-[11px] text-blue-600 bg-blue-50 p-2 rounded-lg">
                  📧 {successOrder.emailStatus.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs md:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
              <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 font-semibold">
                {paymentError}
              </div>
            )}

            {/* Amount Banner */}
            <div className="bg-orange-50/60 rounded-2xl p-4 flex items-center justify-between border border-orange-200/60">
              <div>
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                  {t('payment.totalBill', 'Total Tagihan')}
                </span>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {invoiceNo} ({items.length} {t('common.items', 'item')})
                </p>
              </div>
              <span className="text-2xl font-extrabold text-orange-600 tabular-nums">
                Rp{total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Cash details */}
            <div className="space-y-3">
              {/* Quick nominal buttons */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('payment.cashReceived', 'Uang Tunai Diterima (Rp)')}
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('payment.changeAmount', 'Kembalian (Rp)')}
                  </label>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm font-bold border ${
                      changeAmount >= 0 && cashAmount >= total
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {cashAmount >= total
                      ? `Rp${changeAmount.toLocaleString('id-ID')}`
                      : t('payment.insufficientCash', 'Uang Kurang!')}
                  </div>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('pos.customerName', 'Nama Pelanggan (opsional)')}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('pos.customerName', 'Pelanggan Umum')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('pos.customerEmail', 'Email Pelanggan (opsional untuk nota digital)')}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="pelanggan@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer / Action CTA */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
