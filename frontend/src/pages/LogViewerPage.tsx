import React, { useState, useMemo, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import {
  Terminal,
  RefreshCw,
  Search,
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  X,
  Clock,
  HardDrive,
  Eye,
  Zap,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { TopNavbar, ActiveTab } from '../components/TopNavbar.tsx';
import { TenantSelect } from '../components/TenantSelect.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSystemLogs, useLogFiles, useTenants } from '../hooks/useQueries.ts';
import { api, SystemLogItem } from '../services/api.ts';

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
  } = useSystemLogs({
    file: selectedFile,
    level: selectedLevel,
    tenantId: isAdmin ? selectedTenantId : undefined,
    search: searchQuery,
    page,
    limit: pageSize,
  });

  const logs = logsResponse?.logs || [];
  const pagination = logsResponse?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };

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

  // Render log level badge with consistent light theme styling
  const renderLevelBadge = (level: string) => {
    const lvl = String(level).toLowerCase();
    switch (lvl) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 shrink-0" />
            ERROR
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            WARN
          </span>
        );
      case 'debug':
      case 'verbose':
      case 'silly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Terminal className="w-3 h-3 shrink-0" />
            {lvl.toUpperCase()}
          </span>
        );
      case 'http':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Zap className="w-3 h-3 shrink-0" />
            HTTP
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
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
    <div className="flex-1 flex flex-col h-full bg-[#F5F6F8] overflow-hidden font-sans">
      {/* Top Navbar */}
      <TopNavbar currentTab="system-logs" onNavigate={onNavigate} />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">




        {/* Filter & Controls Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col gap-3 w-full">
            {/* File Selector Dropdown */}
            <Select.Root
              value={selectedFile || undefined}
              onValueChange={(val) => {
                setSelectedFile(val);
                setPage(1);
              }}
              disabled={isLoadingFiles || !filesData?.files || filesData.files.length === 0}
            >
              <Select.Trigger
                aria-label="Pilih File Log"
                className="inline-flex items-center justify-between gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer w-full transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9"
              >
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="w-4 h-4 text-slate-500 shrink-0" />
                  <Select.Value placeholder={isLoadingFiles ? 'Memuat file...' : 'Pilih File Log'}>
                    {selectedFile && filesData?.files ? (
                      (() => {
                        const current = filesData.files.find((f) => f.fileName === selectedFile);
                        return current ? `${current.fileName} (${current.sizeFormatted})` : selectedFile;
                      })()
                    ) : undefined}
                  </Select.Value>
                </div>
                <Select.Icon className="text-slate-400 shrink-0">
                  <ChevronDown className="w-3.5 h-3.5" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={5}
                  className="z-50 w-[var(--radix-select-trigger-width)] min-w-[220px] max-h-[300px] bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 animate-in fade-in-80 zoom-in-95"
                >
                  <Select.ScrollUpButton className="flex items-center justify-center h-6 text-slate-400 cursor-default">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Select.ScrollUpButton>

                  <Select.Viewport className="p-1 space-y-0.5">
                    {filesData?.files && filesData.files.length > 0 ? (
                      filesData.files.map((file) => (
                        <Select.Item
                          key={file.fileName}
                          value={file.fileName}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <Select.ItemText>
                              {file.fileName} ({file.sizeFormatted})
                            </Select.ItemText>
                          </div>
                          <Select.ItemIndicator className="text-orange-600 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                        Tidak ada file log
                      </div>
                    )}
                  </Select.Viewport>

                  <Select.ScrollDownButton className="flex items-center justify-center h-6 text-slate-400 cursor-default">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {/* Tenant Filter (Only for ADMIN) */}
            {isAdmin && (
              <div className="w-full">
                <TenantSelect
                  value={selectedTenantId}
                  onValueChange={(val: string) => {
                    setSelectedTenantId(val);
                    setPage(1);
                  }}
                  tenants={tenantsData?.data || []}
                  allOptionLabel="Semua Tenan (Global)"
                  placeholder="Pilih Tenan"
                  className="h-9 w-full bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                />
              </div>
            )}

            {/* Level Filter Dropdown */}
            <Select.Root
              value={selectedLevel}
              onValueChange={(val) => {
                setSelectedLevel(val);
                setPage(1);
              }}
            >
              <Select.Trigger
                aria-label="Filter Level Log"
                className="inline-flex items-center justify-between gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer w-full transition-all h-9"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Select.Value>
                    {selectedLevel === 'all' ? (
                      <span>Semua Level</span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            selectedLevel === 'info'
                              ? 'bg-blue-500'
                              : selectedLevel === 'warn'
                              ? 'bg-amber-500'
                              : selectedLevel === 'error'
                              ? 'bg-rose-500'
                              : 'bg-purple-500'
                          }`}
                        />
                        {selectedLevel.toUpperCase()}
                      </span>
                    )}
                  </Select.Value>
                </div>
                <Select.Icon className="text-slate-400 shrink-0">
                  <ChevronDown className="w-3.5 h-3.5" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={5}
                  className="z-50 w-[var(--radix-select-trigger-width)] min-w-[155px] bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 animate-in fade-in-80 zoom-in-95"
                >
                  <Select.Viewport className="p-1 space-y-0.5">
                    <Select.Item
                      value="all"
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        <Select.ItemText>Semua Level</Select.ItemText>
                      </div>
                      <Select.ItemIndicator className="text-orange-600 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>

                    <Select.Item
                      value="info"
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <Select.ItemText>INFO</Select.ItemText>
                      </div>
                      <Select.ItemIndicator className="text-orange-600 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>

                    <Select.Item
                      value="warn"
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <Select.ItemText>WARN</Select.ItemText>
                      </div>
                      <Select.ItemIndicator className="text-orange-600 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>

                    <Select.Item
                      value="error"
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <Select.ItemText>ERROR</Select.ItemText>
                      </div>
                      <Select.ItemIndicator className="text-orange-600 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>

                    <Select.Item
                      value="debug"
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none cursor-pointer select-none transition-colors data-[state=checked]:font-semibold data-[state=checked]:text-orange-800 data-[state=checked]:bg-orange-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <Select.ItemText>DEBUG</Select.ItemText>
                      </div>
                      <Select.ItemIndicator className="text-orange-600 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {/* Search Input & Action Buttons */}
            <div className="flex items-center gap-2 w-full">
              {/* Keyword Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pesan, endpoint, IP..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Refresh & Export */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    refetchLogs();
                    refetchFiles();
                  }}
                  disabled={isFetchingLogs}
                  className="h-9 w-9 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center justify-center shrink-0"
                  title="Muat Ulang Log"
                  aria-label="Muat Ulang Log"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingLogs ? 'animate-spin text-orange-600' : ''}`} />
                </button>

                <button
                  onClick={handleDownloadLogs}
                  disabled={logs.length === 0}
                  className="h-9 w-9 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-40 flex items-center justify-center shrink-0"
                  title="Ekspor Log Format JSON"
                  aria-label="Ekspor Log Format JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          {isLoadingLogs ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-mono tracking-wider">
                MEMBACA LOG DARI DISK (WINSTON ASYNC)...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Tidak ada data log yang sesuai</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                    <th className="py-3 px-3 w-24">Level</th>
                    <th className="py-3 px-3 w-40">Tenan / Ruang</th>
                    <th className="py-3 px-3 w-44">Pengguna / Peran</th>
                    <th className="py-3 px-4">Pesan & Detail Permintaan</th>
                    <th className="py-3 px-4 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map((log, index) => {
                    const isError = String(log.level).toLowerCase() === 'error';
                    const isWarn = String(log.level).toLowerCase() === 'warn';
                    return (
                      <tr
                        key={log.id || `${log.timestamp}-${index}`}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isError ? 'bg-rose-50/30' : isWarn ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-2.5 px-4 text-slate-600 font-sans whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium max-w-36 truncate">
                              <Building2 className="w-3 h-3 text-orange-600 shrink-0" />
                              <span className="truncate">{log.tenantName}</span>
                            </span>
                          ) : log.tenantId ? (
                            <span className="text-slate-600 text-[11px] font-mono">
                              {String(log.tenantId).slice(-6)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-sans">
                              Sistem Global
                            </span>
                          )}
                        </td>

                        {/* User & Role */}
                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          {log.role ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800 capitalize">
                                {log.role.toLowerCase()}
                              </span>
                              {log.ip && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {log.ip}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              Internal / Anonim
                            </span>
                          )}
                        </td>

                        {/* Message & Payload */}
                        <td className="py-2.5 px-4 font-mono text-slate-800">
                          <div className="flex flex-wrap items-center gap-2">
                            {log.method && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                                {log.method}
                              </span>
                            )}
                            {log.status && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  log.status >= 500
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : log.status >= 400
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {log.status}
                              </span>
                            )}
                            {log.durationMs !== undefined && (
                              <span className="text-slate-400 text-[10px]">
                                {log.durationMs}ms
                              </span>
                            )}
                            <span className="font-sans text-xs text-slate-900 line-clamp-1 break-all">
                              {log.message}
                            </span>
                          </div>
                          {log.stack && (
                            <p className="mt-1 text-[10px] text-rose-600 font-mono truncate max-w-xl">
                              {log.stack.split('\n')[0]}
                            </p>
                          )}
                        </td>

                        {/* Action: Detail Inspector */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveLogModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer text-xs font-sans font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
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
            <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Menampilkan baris{' '}
                <strong className="text-slate-900">{(page - 1) * pageSize + 1}</strong> -{' '}
                <strong className="text-slate-900">
                  {Math.min(page * pageSize, pagination.total)}
                </strong>{' '}
                dari total <strong className="text-slate-900">{pagination.total}</strong> entri
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="px-3 py-1 font-mono text-slate-800 text-xs font-semibold">
                  {page} / {pagination.totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs font-medium"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Log Detail Inspector Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                {renderLevelBadge(activeLogModal.level)}
                <h3 className="text-sm font-bold text-slate-900 font-sans truncate max-w-md">
                  {activeLogModal.message}
                </h3>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Waktu Tercatat</span>
                  <p className="text-slate-900 font-mono mt-0.5">{formatLogTimestamp(activeLogModal.timestamp)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Cakupan Tenan</span>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {activeLogModal.tenantName || (activeLogModal.tenantId ? `Tenan ${String(activeLogModal.tenantId).slice(-6)}` : 'Sistem Global')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pengguna / Peran</span>
                  <p className="text-slate-900 font-semibold mt-0.5 capitalize">
                    {activeLogModal.role ? `${activeLogModal.role.toLowerCase()}` : 'Tidak terautentikasi'}
                  </p>
                </div>
                {activeLogModal.method && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Metode HTTP</span>
                    <p className="text-slate-900 font-mono mt-0.5">{activeLogModal.method} {activeLogModal.status ? `(${activeLogModal.status})` : ''}</p>
                  </div>
                )}
                {activeLogModal.durationMs !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Latency / Durasi</span>
                    <p className="text-slate-900 font-mono mt-0.5">{activeLogModal.durationMs} ms</p>
                  </div>
                )}
                {activeLogModal.ip && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">IP Address</span>
                    <p className="text-slate-900 font-mono mt-0.5">{activeLogModal.ip}</p>
                  </div>
                )}
              </div>

              {/* Stack Trace if available */}
              {activeLogModal.stack && (
                <div className="space-y-1.5">
                  <span className="text-rose-600 font-bold text-xs uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Stack Trace Kesalahan
                  </span>
                  <pre className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {activeLogModal.stack}
                  </pre>
                </div>
              )}

              {/* Full JSON Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold text-xs">
                    Payload JSON Terstruktur Lengkap
                  </span>
                  <button
                    onClick={() => handleCopyJson(activeLogModal)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer text-[11px] font-medium"
                  >
                    {copiedLogJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                  {JSON.stringify(activeLogModal, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveLogModal(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Log Modal */}
      {isSimulateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Buat Log Pengujian (Simulasi)</h3>
              </div>
              <button
                onClick={() => setIsSimulateOpen(false)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="p-5 space-y-4 text-xs font-sans">
              {simSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{simSuccessMsg}</span>
                </div>
              )}

              {/* Level Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
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
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                            : lvl === 'warn'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                            : lvl === 'debug'
                            ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs'
                            : 'bg-sky-50 border-sky-300 text-sky-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Pesan Log (Opsional)
                </label>
                <textarea
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder={`Contoh: Uji coba entri log level ${simLevel.toUpperCase()}...`}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none font-mono text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <p>
                  • Entri akan dicatat ke <code>application-YYYY-MM-DD.log</code> via Winston Async.
                </p>
                <p>
                  • Jika peran Anda adalah <strong>Pemilik Toko</strong>, log ini akan otomatis berasosiasi dengan ID Tenan Anda.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSim}
                  className="px-4 py-1.5 rounded-xl bg-[#EC6C1A] hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
