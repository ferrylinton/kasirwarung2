import React, { useState, useMemo, useEffect } from 'react';
import {
  Terminal,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  X,
  Play,
  Clock,
  HardDrive,
  Eye,
  ShieldAlert,
  Server,
  Zap,
  FileQuestion,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSystemLogs, useLogFiles, useTenants } from '../hooks/useQueries.ts';
import { api, SystemLogItem, LogFileItem } from '../services/api.ts';

interface LogViewerPageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const LogViewerPage: React.FC<LogViewerPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  // Filters state
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Auto-refresh interval (0 = off, 5000 = 5s, 10000 = 10s)
  const [refreshInterval, setRefreshInterval] = useState<number>(0);

  // Detail Modal State
  const [activeLogModal, setActiveLogModal] = useState<SystemLogItem | null>(null);
  const [copiedLogJson, setCopiedLogJson] = useState<boolean>(false);

  // Simulate Log Modal State
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [simLevel, setSimLevel] = useState<string>('info');
  const [simMessage, setSimMessage] = useState<string>('');

  const [isSubmittingSim, setIsSubmittingSim] = useState<boolean>(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: filesData, isLoading: isLoadingFiles, refetch: refetchFiles } = useLogFiles();
  const { data: tenantsData } = useTenants({ enabled: isAdmin });

  // Update selected file once filesData is loaded if not set yet
  useEffect(() => {
    if (filesData?.files && filesData.files.length > 0 && !selectedFile) {
      setSelectedFile(filesData.files[0].fileName);
    }
  }, [filesData, selectedFile]);

  // Main Logs Query
  const {
    data: logsResponse,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
    refetch: refetchLogs,
  } = useSystemLogs(
    {
      file: selectedFile,
      level: selectedLevel,
      tenantId: isAdmin ? selectedTenantId : undefined,
      search: searchQuery,
      page,
      limit: pageSize,
    },
    {
      refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    }
  );

  const logs = logsResponse?.logs || [];
  const stats = logsResponse?.stats || { total: 0, info: 0, warn: 0, error: 0 };
  const pagination = logsResponse?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const userScope = logsResponse?.userScope;

  // Handle Log Copy
  const handleCopyJson = (log: SystemLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedLogJson(true);
    setTimeout(() => setCopiedLogJson(false), 2000);
  };

  // Handle Export / Download
  const handleDownloadLogs = () => {
    if (!logsResponse || logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${selectedFile || 'export'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit Simulated Log
  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSim(true);
    setSimSuccessMsg(null);
    try {
      const msg = simMessage.trim() || `Pengujian log ${simLevel.toUpperCase()} dari UI Log Viewer`;
      await api.simulateLog({
        level: simLevel,
        message: msg,
        meta: {
          clientTriggered: true,
          page: 'LogViewerPage',
          timestamp: new Date().toISOString(),
        },
      });
      setSimSuccessMsg(`Berhasil mencatat log ${simLevel.toUpperCase()} ke Winston Daily Rotate!`);
      setSimMessage('');
      setTimeout(() => {
        setIsSimulateOpen(false);
        setSimSuccessMsg(null);
        refetchLogs();
        refetchFiles();
      }, 1000);
    } catch (err: any) {
      alert(`Gagal membuat log tes: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingSim(false);
    }
  };

  // Render log level badge
  const renderLevelBadge = (level: string) => {
    const lvl = String(level).toLowerCase();
    switch (lvl) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 shrink-0" />
            ERROR
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            WARN
          </span>
        );
      case 'debug':
      case 'verbose':
      case 'silly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Terminal className="w-3 h-3 shrink-0" />
            {lvl.toUpperCase()}
          </span>
        );
      case 'http':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <Zap className="w-3 h-3 shrink-0" />
            HTTP
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3 shrink-0" />
            {lvl.toUpperCase()}
          </span>
        );
    }
  };


  // Format timestamp safely
  const formatLogTimestamp = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = parseISO(dateStr);
      return format(d, 'dd MMM yyyy HH:mm:ss', { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1115] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <TopNavbar currentTab="system-logs" onNavigate={onNavigate} />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-[#EC6C1A] border border-orange-500/30 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Log Sistem
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-normal">
                  Winston Daily Rotate
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Rotasi file harian otomatis (retensi max 1 bulan / 30 hari, max 10 MB per file) dengan logging async non-blocking.
            </p>
          </div>

          {/* Role & Scope Indicator */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-medium">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span>Hak Akses: <strong>Global Admin</strong> (Semua Tenan)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Hak Akses: <strong>Pemilik Toko</strong> ({userScope?.tenantName || user?.tenantName || 'Tenan Anda'})
                </span>
              </div>
            )}

            {/* Active LOG_LEVEL Indicator from .env */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono"
              title="Tingkat log Winston aktif yang dimuat dari file konfigurasi .env (LOG_LEVEL)"
            >
              <span className="text-slate-400">LOG_LEVEL:</span>
              <span className="font-bold text-orange-400 uppercase">
                {logsResponse?.currentLogLevel || filesData?.currentLogLevel || 'INFO'}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">(.env)</span>
            </div>

            {/* Test Log Generator Button */}
            <button
              onClick={() => setIsSimulateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Buat Log Pengujian"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tes Log</span>
            </button>

            {/* Quick Preview 404 & Error Page */}
            {onNavigate && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate('not-found')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                  title="Lihat Tampilan Halaman 404 Not Found"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-orange-400" />
                  <span>Preview 404</span>
                </button>
                <button
                  onClick={() => onNavigate('error')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                  title="Lihat Tampilan Halaman 500 Error"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Preview 500</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card: Total Logs */}
          <div className="bg-[#181A1F] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Entri</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{stats.total}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-36">
                File: {selectedFile || 'Hari ini'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card: Info Logs */}
          <button
            onClick={() => { setSelectedLevel(selectedLevel === 'info' ? 'all' : 'info'); setPage(1); }}
            className={`text-left bg-[#181A1F] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer ${
              selectedLevel === 'info'
                ? 'border-sky-500/60 ring-2 ring-sky-500/20 bg-sky-950/20'
                : 'border-white/5 hover:border-white/15'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">Info</p>
              <h3 className="text-2xl font-bold text-sky-300 mt-0.5">{stats.info}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Operasional normal</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Info className="w-5 h-5" />
            </div>
          </button>

          {/* Card: Warn Logs */}
          <button
            onClick={() => { setSelectedLevel(selectedLevel === 'warn' ? 'all' : 'warn'); setPage(1); }}
            className={`text-left bg-[#181A1F] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer ${
              selectedLevel === 'warn'
                ? 'border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-950/20'
                : 'border-white/5 hover:border-white/15'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Warning</p>
              <h3 className="text-2xl font-bold text-amber-300 mt-0.5">{stats.warn}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Permintaan bermasalah</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

          {/* Card: Error Logs */}
          <button
            onClick={() => { setSelectedLevel(selectedLevel === 'error' ? 'all' : 'error'); setPage(1); }}
            className={`text-left bg-[#181A1F] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer ${
              selectedLevel === 'error'
                ? 'border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-950/20'
                : 'border-white/5 hover:border-white/15'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Error</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-0.5">{stats.error}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Kegagalan sistem</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="bg-[#181A1F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left Controls: File Selector & Tenant Selector */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* File Selector Dropdown */}
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedFile}
                  onChange={(e) => {
                    setSelectedFile(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#22252B] border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-500 transition-colors cursor-pointer min-w-44"
                >
                  {filesData?.files && filesData.files.length > 0 ? (
                    filesData.files.map((file) => (
                      <option key={file.fileName} value={file.fileName}>
                        {file.fileName} ({file.sizeFormatted})
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada file log</option>
                  )}
                </select>
              </div>

              {/* Tenant Filter (Only for ADMIN) */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <TenantSelect
                    value={selectedTenantId}
                    onValueChange={(val: string) => {
                      setSelectedTenantId(val);
                      setPage(1);
                    }}
                    tenants={tenantsData?.data || []}
                    allOptionLabel="Semua Tenan (Global)"
                    placeholder="Pilih Tenan"
                    className="!bg-[#22252B] !border-white/10 !text-slate-200 !shadow-none"
                  />
                </div>
              )}

              {/* Level Filter Tabs */}
              <div className="flex items-center bg-[#22252B] p-1 rounded-xl border border-white/5 overflow-x-auto">
                {(['all', 'info', 'warn', 'error', 'debug'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedLevel(lvl);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                      selectedLevel === lvl
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {lvl === 'all' ? 'Semua Level' : lvl.toUpperCase()}
                  </button>
                ))}
              </div>

            </div>

            {/* Right Controls: Search, Auto-refresh, Export */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Keyword Search */}
              <div className="relative min-w-56 flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pesan, endpoint, IP, user..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-2 bg-[#22252B] border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Auto Refresh Select */}
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-[#22252B] border border-white/10 text-slate-300 text-xs rounded-xl px-2.5 py-2 outline-none focus:border-orange-500 cursor-pointer"
                title="Interval Refresh Otomatis"
              >
                <option value={0}>Auto-refresh: Mati</option>
                <option value={5000}>Auto-refresh: 5s</option>
                <option value={10000}>Auto-refresh: 10s</option>
                <option value={30000}>Auto-refresh: 30s</option>
              </select>

              {/* Manual Refresh Button */}
              <button
                onClick={() => {
                  refetchLogs();
                  refetchFiles();
                }}
                disabled={isFetchingLogs}
                className="p-2 rounded-xl bg-[#22252B] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Muat Ulang Log"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingLogs ? 'animate-spin text-orange-500' : ''}`} />
              </button>

              {/* Download / Export Button */}
              <button
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
                className="p-2 rounded-xl bg-[#22252B] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Ekspor Log Format JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table / Card List */}
        <div className="bg-[#181A1F] border border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {isLoadingLogs ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                MEMBACA LOG DARI DISK (WINSTON ASYNC)...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Tidak ada data log yang sesuai</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedLevel !== 'all' || selectedTenantId !== 'ALL'
                  ? 'Coba sesuaikan kata kunci pencarian, filter level, atau pilih file log lainnya.'
                  : 'Belum ada log tercatat pada file ini. Anda dapat menekan tombol "Tes Log" untuk membuat entri pengujian.'}
              </p>
              {(searchQuery || selectedLevel !== 'all' || (isAdmin && selectedTenantId !== 'ALL')) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('all');
                    setSelectedTenantId('ALL');
                    setPage(1);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#14161A] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                    <th className="py-3 px-3 w-24">Level</th>
                    <th className="py-3 px-3 w-40">Tenan / Ruang</th>
                    <th className="py-3 px-3 w-44">Pengguna / Peran</th>
                    <th className="py-3 px-4">Pesan & Detail Permintaan</th>
                    <th className="py-3 px-4 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {logs.map((log, index) => {
                    const isError = String(log.level).toLowerCase() === 'error';
                    const isWarn = String(log.level).toLowerCase() === 'warn';
                    return (
                      <tr
                        key={log.id || `${log.timestamp}-${index}`}
                        className={`transition-colors hover:bg-white/[0.03] ${
                          isError ? 'bg-rose-500/[0.04]' : isWarn ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-2.5 px-4 text-slate-300 font-sans whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{formatLogTimestamp(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {renderLevelBadge(log.level)}
                        </td>

                        {/* Tenant Scope */}
                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          {log.tenantName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-slate-200 border border-white/10 text-[11px] font-medium max-w-36 truncate">
                              <Building2 className="w-3 h-3 text-orange-400 shrink-0" />
                              <span className="truncate">{log.tenantName}</span>
                            </span>
                          ) : log.tenantId ? (
                            <span className="text-slate-400 text-[11px] font-mono">
                              {String(log.tenantId).slice(-6)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic font-sans">
                              Sistem Global
                            </span>
                          )}
                        </td>

                        {/* User & Role */}
                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          {log.role ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-200 capitalize">
                                {log.role.toLowerCase()}
                              </span>
                              {log.ip && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {log.ip}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">
                              Internal / Anonim
                            </span>
                          )}
                        </td>

                        {/* Message & Payload */}
                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          <div className="flex flex-wrap items-center gap-2">
                            {log.method && (
                              <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-bold">
                                {log.method}
                              </span>
                            )}
                            {log.status && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  log.status >= 500
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : log.status >= 400
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {log.status}
                              </span>
                            )}
                            {log.durationMs !== undefined && (
                              <span className="text-slate-500 text-[10px]">
                                {log.durationMs}ms
                              </span>
                            )}
                            <span className="font-sans text-xs text-slate-200 line-clamp-1 break-all">
                              {log.message}
                            </span>
                          </div>
                          {log.stack && (
                            <p className="mt-1 text-[10px] text-rose-400/80 font-mono truncate max-w-xl">
                              {log.stack.split('\n')[0]}
                            </p>
                          )}
                        </td>

                        {/* Action: Detail Inspector */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveLogModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-sans font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-white/10 px-4 py-3 bg-[#14161A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Menampilkan baris{' '}
                <strong className="text-white">{(page - 1) * pageSize + 1}</strong> -{' '}
                <strong className="text-white">
                  {Math.min(page * pageSize, pagination.total)}
                </strong>{' '}
                dari total <strong className="text-white">{pagination.total}</strong> entri
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="px-3 py-1 font-mono text-white text-xs font-semibold">
                  {page} / {pagination.totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#181A1F] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14161A]">
              <div className="flex items-center gap-2.5">
                {renderLevelBadge(activeLogModal.level)}
                <h3 className="text-sm font-bold text-white font-sans truncate max-w-md">
                  {activeLogModal.message}
                </h3>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#111317] p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Waktu Tercatat</span>
                  <p className="text-slate-200 font-mono mt-0.5">{formatLogTimestamp(activeLogModal.timestamp)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Cakupan Tenan</span>
                  <p className="text-slate-200 font-semibold mt-0.5">
                    {activeLogModal.tenantName || (activeLogModal.tenantId ? `Tenan ${String(activeLogModal.tenantId).slice(-6)}` : 'Sistem Global')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pengguna / Peran</span>
                  <p className="text-slate-200 font-semibold mt-0.5 capitalize">
                    {activeLogModal.role ? `${activeLogModal.role.toLowerCase()}` : 'Tidak terautentikasi'}
                  </p>
                </div>
                {activeLogModal.method && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Metode HTTP</span>
                    <p className="text-slate-200 font-mono mt-0.5">{activeLogModal.method} {activeLogModal.status ? `(${activeLogModal.status})` : ''}</p>
                  </div>
                )}
                {activeLogModal.durationMs !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Latency / Durasi</span>
                    <p className="text-slate-200 font-mono mt-0.5">{activeLogModal.durationMs} ms</p>
                  </div>
                )}
                {activeLogModal.ip && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">IP Address</span>
                    <p className="text-slate-200 font-mono mt-0.5">{activeLogModal.ip}</p>
                  </div>
                )}
              </div>

              {/* Stack Trace if available */}
              {activeLogModal.stack && (
                <div className="space-y-1.5">
                  <span className="text-rose-400 font-bold text-xs uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Stack Trace Kesalahan
                  </span>
                  <pre className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/20 text-rose-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {activeLogModal.stack}
                  </pre>
                </div>
              )}

              {/* Full JSON Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold text-xs">
                    Payload JSON Terstruktur Lengkap
                  </span>
                  <button
                    onClick={() => handleCopyJson(activeLogModal)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
                  >
                    {copiedLogJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-[#0D0E11] border border-white/10 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                  {JSON.stringify(activeLogModal, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-white/10 bg-[#14161A] flex justify-end">
              <button
                onClick={() => setActiveLogModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Log Modal */}
      {isSimulateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#181A1F] border border-white/15 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#14161A]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-white">Buat Log Pengujian (Simulasi)</h3>
              </div>
              <button
                onClick={() => setIsSimulateOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="p-5 space-y-4 text-xs font-sans">
              {simSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{simSuccessMsg}</span>
                </div>
              )}

              {/* Level Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">
                  Pilih Tingkat Log (Level)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['info', 'warn', 'error', 'debug'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSimLevel(lvl)}
                      className={`py-2 rounded-xl font-bold uppercase transition-all cursor-pointer border ${
                        simLevel === lvl
                          ? lvl === 'error'
                            ? 'bg-rose-500/25 border-rose-500 text-rose-300 shadow-xs'
                            : lvl === 'warn'
                            ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-xs'
                            : lvl === 'debug'
                            ? 'bg-purple-500/25 border-purple-500 text-purple-300 shadow-xs'
                            : 'bg-sky-500/25 border-sky-500 text-sky-300 shadow-xs'
                          : 'bg-[#22252B] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

              </div>

              {/* Message Input */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">
                  Pesan Log (Opsional)
                </label>
                <textarea
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder={`Contoh: Uji coba entri log level ${simLevel.toUpperCase()}...`}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#22252B] border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none font-mono text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 text-[11px] text-slate-400 space-y-1">
                <p>
                  • Entri akan dicatat ke <code>application-YYYY-MM-DD.log</code> via Winston Async.
                </p>
                <p>
                  • Jika peran Anda adalah <strong>Pemilik Toko</strong>, log ini akan otomatis berasosiasi dengan ID Tenan Anda.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSim}
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingSim ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Catat Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewerPage;
