import React, { useEffect } from 'react';
import { PauseCircle, Plus, FileText, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { Order } from '../services/api.ts';

interface SavedOrdersBarProps {
  onOpenAllSaved?: () => void;
}

export const SavedOrdersBar: React.FC<SavedOrdersBarProps> = ({ onOpenAllSaved }) => {
  const {
    savedOrders,
    savedOrdersCount,
    startNewTransaction,
    resumeOrder,
    deleteSavedOrder,
  } = useCart();

  // Keyboard shortcut Shift + N for new transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        startNewTransaction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewTransaction]);

  return (
    <div className="mb-5">
      {/* Section Header */}
      <div className="flex items-center justify-between text-xs md:text-sm font-semibold tracking-wide text-slate-600 uppercase mb-2.5">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-orange-500 text-base leading-none">⌧</span>
          <span>PESANAN DISIMPAN (BELUM DIBAYAR)</span>
        </div>
        <button
          onClick={onOpenAllSaved}
          className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-0.5 lowercase first-letter:uppercase text-xs cursor-pointer"
        >
          <span>{savedOrdersCount} Disimpan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
        {/* Saved Order Card(s) */}
        {savedOrders.map((order: Order) => (
          <div
            key={order.id || order.invoiceNo}
            className="w-64 md:w-72 bg-white rounded-2xl p-3.5 border-2 border-[#F59E0B]/80 shadow-xs flex flex-col justify-between shrink-0 hover:shadow-md transition-shadow relative"
          >
            {/* Top row: Status pill + options */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <span className="text-[10px]">⏸</span>
                <span>Belum Dibayar</span>
              </span>
              <button
                onClick={() => deleteSavedOrder(order.invoiceNo)}
                title="Hapus / Batalkan pesanan tersimpan"
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm hover:bg-slate-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice & Time */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                <span className="text-amber-500">📄</span>
                <span>{order.invoiceNo}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {order.timeLabel || '14:15'}
              </span>
            </div>

            {/* Summary items */}
            <p className="text-xs text-slate-500 truncate mb-3">
              {order.summaryLabel ||
                `${order.items?.length || 0} Item: ${order.items
                  ?.map((i) => i.name)
                  .join(', ')}`}
            </p>

            {/* Price & Action Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="font-bold text-sm md:text-base text-slate-900 tabular-nums">
                Rp{(order.total || 0).toLocaleString('id-ID')}
              </span>
              <button
                onClick={() => resumeOrder(order)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>Lanjutkan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Fallback mock card if no saved orders exist */}
        {savedOrders.length === 0 && (
          <div className="w-64 md:w-72 bg-white rounded-2xl p-3.5 border-2 border-[#F59E0B]/80 shadow-xs flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <span>⏸</span>
                <span>Belum Dibayar</span>
              </span>
              <span className="text-slate-400 text-xs">...</span>
            </div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                <span className="text-amber-500">📄</span>
                <span>INV/2025/05/28-0041</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">14:15</span>
            </div>
            <p className="text-xs text-slate-500 truncate mb-3">
              4 Item: Beras, Telur, Minyak...
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="font-bold text-sm md:text-base text-slate-900 tabular-nums">
                Rp85.500
              </span>
              <span className="text-xs font-semibold text-orange-600 cursor-pointer">
                Lanjutkan &gt;
              </span>
            </div>
          </div>
        )}

        {/* Create New Transaction Card (Dashed border) */}
        <button
          onClick={startNewTransaction}
          title="Mulai transaksi baru (Shift + N)"
          className="w-52 md:w-60 h-[126px] bg-white hover:bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-300 p-3.5 flex flex-col items-center justify-center gap-1.5 text-center shrink-0 cursor-pointer transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-orange-50 text-slate-500 group-hover:text-orange-600 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            Buka Transaksi Baru
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            (Shift + N)
          </span>
        </button>
      </div>
    </div>
  );
};
