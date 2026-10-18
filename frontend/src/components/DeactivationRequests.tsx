import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
} from 'lucide-react';
import { api, DeactivationRequestItem } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useDeactivationRequests } from '../hooks/useQueries.ts';

export interface DeactivationRequestsProps {
  onNavigate?: (tab: any) => void;
  onRequestReviewed?: () => void;
}

export const DeactivationRequests: React.FC<DeactivationRequestsProps> = ({
  onRequestReviewed,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // TanStack Query for deactivation requests
  const {
    data: requestsData,
    isLoading: loading,
    refetch: fetchRequests,
  } = useDeactivationRequests();
  const requests = requestsData?.data || [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<DeactivationRequestItem | null>(null);

  // Review (Approve / Reject) Modal
  const [reviewModal, setReviewModal] = useState<{
    request: DeactivationRequestItem;
    action: 'approve' | 'reject';
    rejectReason: string;
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleExecuteReview = async () => {
    if (!reviewModal) return;
    const { request, action, rejectReason } = reviewModal;

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.reviewDeactivation(request.tenantId, action, rejectReason.trim());
      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        setReviewModal(null);
        if (selectedRequest?.id === request.id) {
          setSelectedRequest(null);
        }
        await fetchRequests();
        onRequestReviewed?.();
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Gagal memproses peninjauan', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.tenantName.toLowerCase().includes(q) ||
        r.tenantCode.toLowerCase().includes(q) ||
        r.ownerEmail.toLowerCase().includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.reviewedBy && r.reviewedBy.toLowerCase().includes(q)) ||
        (r.rejectReason && r.rejectReason.toLowerCase().includes(q))
      );
    });
  }, [requests, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    const cancelled = requests.filter((r) => r.status === 'cancelled').length;
    return { total, pending, approved, rejected, cancelled };
  }, [requests]);

  // Pagination calculation
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: DeactivationRequestItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Disetujui (Nonaktif)</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/80">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Ditolak Admin</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
            <span>Dibatalkan Pemilik</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Akses Khusus Administrator</h2>
        <p className="text-xs text-slate-500">
          Histori permintaan penonaktifan toko hanya dapat diakses oleh akun dengan role ADMIN.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs md:text-sm font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}


      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama toko, kode tenan, email, alasan, atau reviewer..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
          />
        </div>

        {/* Status Tabs Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menunggu ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disetujui ({stats.approved})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ditolak ({stats.rejected})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batal ({stats.cancelled})
          </button>
        </div>
      </div>

      {/* Requests Card Container (Responsive: Mobile Cards + Desktop Table + Pagination) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Title Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-sm md:text-base">
              Daftar Permintaan Penonaktifan ({totalItems})
            </h2>
          </div>
          <button
            onClick={() => { fetchRequests(); }}
            disabled={loading}
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Mobile View: Responsive Cards (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memuat riwayat penonaktifan toko...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada data permintaan penonaktifan yang cocok.
            </div>
          ) : (
            paginatedRequests.map((req) => (
              <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                {/* Top: Store Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm truncate">{req.tenantName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {req.tenantCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{req.ownerEmail}</p>
                  </div>
                  <div className="shrink-0">{renderStatusBadge(req.status)}</div>
                </div>

                {/* Reason Box */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Alasan Penonaktifan:
                  </span>
                  <p className="text-slate-800 italic">"{req.reason}"</p>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(req.requestedAt)}</span>
                  </div>

                  {req.reviewedBy && (
                    <span className="text-slate-400">
                      Oleh: {req.reviewedBy.split('@')[0]}
                    </span>
                  )}
                </div>

                {/* Rejection Note if rejected */}
                {req.status === 'rejected' && req.rejectReason && (
                  <div className="bg-red-50/80 p-2 rounded-lg border border-red-100 text-[11px] text-red-700">
                    <span className="font-bold block">Catatan Penolakan:</span>
                    <span>{req.rejectReason}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>

                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setReviewModal({ request: req, action: 'reject', rejectReason: '' })}
                        disabled={actionLoading}
                        className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => setReviewModal({ request: req, action: 'approve', rejectReason: '' })}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Setujui
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop & Tablet Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Toko / Tenan</th>
                <th className="py-3 px-4">Pemilik & Pengaju</th>
                <th className="py-3 px-4">Alasan Diajukan</th>
                <th className="py-3 px-4">Waktu Pengajuan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data histori permintaan penonaktifan...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat penonaktifan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Toko / Tenan */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{req.tenantName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {req.tenantCode}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              req.currentTenantStatus === 'active' ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            • {req.currentTenantStatus === 'active' ? 'Toko Aktif' : 'Toko Nonaktif'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Pemilik */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-800">{req.ownerEmail}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Oleh: {req.requestedBy}</p>
                      </div>
                    </td>

                    {/* Alasan */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 italic truncate" title={req.reason}>
                        "{req.reason}"
                      </p>
                    </td>

                    {/* Waktu */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 tabular-nums">
                      {formatDate(req.requestedAt)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(req.status)}
                    </td>

                    {/* Reviewer / Hasil */}
                    <td className="py-3.5 px-4">
                      {req.reviewedBy ? (
                        <div>
                          <p className="font-medium text-slate-800 truncate">{req.reviewedBy}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(req.reviewedAt)}</p>
                          {req.rejectReason && (
                            <p className="text-[10px] text-red-600 italic truncate mt-0.5" title={req.rejectReason}>
                              Catatan: {req.rejectReason}
                            </p>
                          )}
                        </div>
                      ) : req.status === 'cancelled' ? (
                        <div>
                          <span className="text-[11px] text-slate-400">Dibatalkan tenan</span>
                          <p className="text-[10px] text-slate-400">{formatDate(req.cancelledAt)}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Menunggu tindak lanjut</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          title="Lihat Detail Riwayat"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setReviewModal({ request: req, action: 'reject', rejectReason: '' })}
                              disabled={actionLoading}
                              title="Tolak Permintaan"
                              className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => setReviewModal({ request: req, action: 'approve', rejectReason: '' })}
                              disabled={actionLoading}
                              title="Setujui & Nonaktifkan Toko"
                              className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              Setujui
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="p-3.5 md:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-600">
            {/* Summary */}
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-600">
                Menampilkan{' '}
                <span className="font-bold text-slate-900 tabular-nums">{startIndex + 1}</span>–
                <span className="font-bold text-slate-900 tabular-nums">{endIndex}</span> dari{' '}
                <span className="font-bold text-slate-900 tabular-nums">{totalItems}</span> permintaan
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    return page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1;
                  })
                  .map((page, idx, arr) => {
                    const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && <span className="px-1 text-slate-400 select-none">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            safeCurrentPage === page
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                aria-label="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Action Modal (Approve / Reject) */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`p-2 rounded-xl ${
                    reviewModal.action === 'approve'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {reviewModal.action === 'approve' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {reviewModal.action === 'approve'
                    ? 'Setujui Penonaktifan Toko'
                    : 'Tolak Permintaan Penonaktifan'}
                </h3>
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-slate-600">
              <p>
                {reviewModal.action === 'approve' ? (
                  <>
                    Apakah Anda yakin ingin <strong>menyetujui penonaktifan</strong> untuk toko{' '}
                    <strong className="text-slate-900">{reviewModal.request.tenantName}</strong> ({reviewModal.request.tenantCode})?
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin <strong>menolak permintaan penonaktifan</strong> untuk toko{' '}
                    <strong className="text-slate-900">{reviewModal.request.tenantName}</strong>? Toko akan tetap aktif beroperasi.
                  </>
                )}
              </p>

              {reviewModal.action === 'approve' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs space-y-1">
                  <p className="font-bold">⚠️ Perhatian Konsekuensi:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Status tenan akan diubah menjadi <strong>inactive</strong>.</li>
                    <li>Seluruh staf kasir dan pemilik toko <strong>tidak dapat lagi login</strong> ke sistem POS.</li>
                    <li>Pemilik toko dapat mengajukan pengaktifan kembali via portal verifikasi email.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="rejectReason" className="block text-xs font-bold text-slate-700">
                    Alasan Penolakan (Opsional, akan dikirimkan ke pemilik toko):
                  </label>
                  <textarea
                    id="rejectReason"
                    rows={3}
                    value={reviewModal.rejectReason}
                    onChange={(e) =>
                      setReviewModal({ ...reviewModal, rejectReason: e.target.value })
                    }
                    placeholder="Contoh: Silakan selesaikan sisa pembukuan laporan shift kasir terlebih dahulu..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReview}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                  reviewModal.action === 'approve'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {actionLoading ? 'Memproses...' : reviewModal.action === 'approve' ? 'Ya, Nonaktifkan Toko' : 'Tolak Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Audit Drawer/Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Rincian Histori Penonaktifan
                  </h3>
                  <p className="text-xs text-slate-400">ID: {selectedRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status Header */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Status Pengajuan
                  </span>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Status Toko Saat Ini
                  </span>
                  <span
                    className={`font-bold mt-1 inline-block ${
                      selectedRequest.currentTenantStatus === 'active' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {selectedRequest.currentTenantStatus === 'active' ? '🟢 Operasional Aktif' : '🔴 Dinonaktifkan'}
                  </span>
                </div>
              </div>

              {/* Store & Owner Data */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Nama Toko / Tenan</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.tenantName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Kode Tenan</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedRequest.tenantCode}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Email Pemilik Toko</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedRequest.ownerEmail}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Akun Pengaju</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedRequest.requestedBy}</p>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  Alasan Penonaktifan:
                </span>
                <p className="text-slate-800 text-xs italic leading-relaxed">
                  "{selectedRequest.reason}"
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Diajukan pada {formatDate(selectedRequest.requestedAt)}</span>
                </div>
              </div>

              {/* Review Audit Details */}
              {selectedRequest.reviewedBy && (
                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1.5">
                  <span className="text-purple-700 text-[10px] font-bold uppercase tracking-wider block">
                    Informasi Peninjauan Admin:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px]">Ditinjau Oleh:</span>
                      <p className="font-semibold text-slate-800">{selectedRequest.reviewedBy}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Waktu Peninjauan:</span>
                      <p className="font-semibold text-slate-800">{formatDate(selectedRequest.reviewedAt)}</p>
                    </div>
                  </div>
                  {selectedRequest.rejectReason && (
                    <div className="pt-1 border-t border-purple-100">
                      <span className="text-red-600 text-[10px] font-bold">Catatan / Alasan Penolakan:</span>
                      <p className="text-red-700 italic mt-0.5">{selectedRequest.rejectReason}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.status === 'cancelled' && (
                <div className="p-3 bg-slate-100/70 rounded-2xl text-slate-600 text-xs">
                  <p className="font-medium">
                    Permintaan ini dibatalkan secara mandiri oleh pemilik toko pada{' '}
                    <strong>{formatDate(selectedRequest.cancelledAt)}</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReviewModal({ request: selectedRequest, action: 'reject', rejectReason: '' });
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => {
                      setReviewModal({ request: selectedRequest, action: 'approve', rejectReason: '' });
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Setujui & Nonaktifkan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
