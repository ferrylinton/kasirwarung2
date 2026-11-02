import React from 'react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Globe,
  Package,
  History,
  Calendar,
  Download,
  Mail,
  MapPin,
  ArrowLeft,
  Clock,
  Trash2,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { LanguageSelector } from '../components/LanguageSelector.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ADMIN } from '../constants/roles.ts';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  isModal?: boolean;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBack,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (user) {
      navigate(user.role === ADMIN ? '/tenants' : '/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)] font-sans ${isModal ? 'p-0' : 'overflow-hidden'}`}>
      {/* Top Navbar if rendered as full page and logged in */}
      {!isModal && user && (
        <TopNavbar currentTab="privacy-policy" />
      )}

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          {/* Header Card */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 md:p-8 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[var(--color-brand)] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[11px] font-semibold tracking-wide uppercase mb-1 border border-orange-500/20">
                    {t('privacy.docBadge', 'Dokumen Resmi')}
                  </div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {t('privacy.pageTitle', 'Kebijakan Privasi')}
                  </h1>
                  <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
                    {t('privacy.headerSubtitle', 'Transparansi pengelolaan data, keamanan enkripsi, dan retensi informasi Kasir Warung')}
                  </p>
                </div>
              </div>

              {/* Actions: Bahasa & Kembali */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <LanguageSelector variant="compact" />
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>{t('privacy.back', 'Kembali')}</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                {t('privacy.lastUpdated', 'Terakhir diperbarui: 31 Oktober 2026')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t('privacy.applicableTo', 'Berlaku untuk Tenan, Staf Kasir, & Administrator')}
              </span>
            </div>
          </div>

          {/* Section 1: Data Akun & Login */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section1Title', '1. Data Nama, Email, & Autentikasi Akun')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section1Subtitle', 'Digunakan khusus untuk proses masuk (login) dan verifikasi identitas akun')}
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
              <p>
                {isEn ? (
                  <>
                    We collect data including <strong className="font-bold text-[var(--text-primary)]">User Name</strong> and{' '}
                    <strong className="font-bold text-[var(--text-primary)]">Email Address</strong> when you register a store (tenant) account or when cashier staff members are added to the system:
                  </>
                ) : (
                  <>
                    Kami mengumpulkan data berupa <strong className="font-bold text-[var(--text-primary)]">Nama Pengguna</strong> dan{' '}
                    <strong className="font-bold text-[var(--text-primary)]">Alamat Email</strong> ketika Anda mendaftarkan akun toko (tenan) maupun saat staf kasir ditambahkan ke dalam sistem:
                  </>
                )}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">{t('privacy.section1Point1Title', 'Autentikasi & Akses:')}</strong>{' '}
                  {t('privacy.section1Point1Desc', 'Email digunakan sebagai pengenal utama untuk proses masuk (login) ke aplikasi.')}
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">{t('privacy.section1Point2Title', 'Verifikasi Akun & Keamanan:')}</strong>{' '}
                  {t('privacy.section1Point2Desc', 'Email digunakan untuk mengirimkan tautan verifikasi pendaftaran tenan, konfirmasi pengaktifan kembali toko (reactivation), serta notifikasi keamanan penting.')}
                </li>
                <li>
                  {t('privacy.section1Point3', 'Kami tidak membagikan, memperjualbelikan, atau mengalihkan alamat email dan nama Anda kepada pihak ketiga manapun untuk tujuan pemasaran.')}
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Password & Enkripsi Bcrypt */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section2Title', '2. Keamanan Password & Enkripsi Bcrypt')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section2Subtitle', 'Perlindungan kata sandi tingkat tinggi tanpa penyimpanan teks terbuka')}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-bold">{t('privacy.section2HashBadge', 'Standar Enkripsi Satu Arah (One-Way Hash):')}</span>
                <p>
                  {isEn ? (
                    <>
                      Your password is <strong className="font-bold">encrypted and stored using the bcrypt hashing algorithm</strong> (with adaptive salt rounds). Neither the system nor developers ever store or have access to your plain-text password.
                    </>
                  ) : (
                    <>
                      Kata sandi Anda <strong className="font-bold">disimpan setelah dienkripsi menggunakan algoritma bcrypt</strong> (dengan salt rounds adaptif). Sistem maupun pengembang tidak pernah menyimpan ataupun mengetahui kata sandi asli (plain text) Anda.
                    </>
                  )}
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('privacy.section2Detail', 'Bahkan apabila terjadi upaya pembacaan basis data tanpa izin, kata sandi Anda tetap terlindungi karena proses enkripsi satu arah tidak dapat dibalik menjadi kata sandi asli. Setiap verifikasi login dilakukan dengan mencocokkan hash bcrypt secara matematis.')}
            </p>
          </div>

          {/* Section 3: Data Peramban (Browser) & Keamanan Sistem */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section3Title', '3. Data Peramban (Browser) untuk Keamanan')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section3Subtitle', 'Informasi teknis peramban dicatat demi mencegah akses tidak sah')}
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
              <p>
                {t('privacy.section3Intro', 'Saat Anda mengakses atau melakukan login ke aplikasi, sistem secara otomatis mencatat informasi teknis:')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="font-bold text-[var(--text-primary)] text-xs mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    {t('privacy.section3Card1Title', 'Data Browser & User-Agent')}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-snug">
                    {t('privacy.section3Card1Desc', 'Tipe peramban (Chrome, Firefox, Safari, Edge), versi, dan sistem operasi yang digunakan untuk mengakses aplikasi.')}
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="font-bold text-[var(--text-primary)] text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    {t('privacy.section3Card2Title', 'Tujuan Keamanan')}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-snug">
                    {t('privacy.section3Card2Desc', 'Mendeteksi sesi aktif ganda, mencegah serangan pembajakan sesi (session hijacking), dan melindungi toko dari aktivitas mencurigakan.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Data Produk & Kategori */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section4Title', '4. Data Produk & Kategori Produk')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section4Subtitle', 'Disimpan untuk operasional katalog dan transaksi kasir harian')}
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
              <p>
                {isEn ? (
                  <>
                    Catalog data you input — including{' '}
                    <strong className="font-bold text-[var(--text-primary)]">
                      product names, barcodes/SKUs, product categories, cost prices, selling prices, and inventory stock counts
                    </strong>{' '}
                    — is securely stored in isolated tenant databases.
                  </>
                ) : (
                  <>
                    Data katalog yang Anda masukkan — meliputi{' '}
                    <strong className="font-bold text-[var(--text-primary)]">
                      nama produk, barcode/SKU, kategori produk, harga modal, harga jual, dan jumlah stok
                    </strong>{' '}
                    — disimpan secara aman dalam basis data aplikasi terisolasi per tenan.
                  </>
                )}
              </p>
              <p className="text-[var(--text-secondary)]">
                {t('privacy.section4Desc', 'Data ini sepenuhnya milik tenan Anda dan digunakan semata-mata untuk mengoperasikan fungsi kasir Point of Sale (POS), pencarian barcode, dan kalkulasi total belanja pelanggan di warung Anda.')}
              </p>
            </div>
          </div>

          {/* Section 5: Retensi 3 Bulan & Unduh Data (Penjualan & Login) */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[var(--color-brand)] flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section5Title', '5. Histori Penjualan & Histori Login (Retensi 3 Bulan & Fitur Unduh)')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section5Subtitle', 'Kebijakan retensi transparan, hak pengunduhan data, dan pembersihan otomatis')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Card Histori Penjualan */}
              <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs md:text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-brand)]" />
                    {t('privacy.section5SalesTitle', 'Histori Penjualan')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                    {t('privacy.section5RetentionBadge', 'Retensi 3 Bulan')}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isEn ? (
                    <>
                      Used for <strong className="font-bold text-[var(--text-primary)]">sales performance analytics</strong>, daily/monthly revenue accounting reports, and store bookkeeping.
                    </>
                  ) : (
                    <>
                      Digunakan untuk <strong className="font-bold text-[var(--text-primary)]">keperluan analitik performa penjualan</strong>, laporan omzet harian/bulanan, dan pembukuan toko.
                    </>
                  )}
                </p>
                <div className="p-2.5 bg-[var(--bg-surface)] rounded-lg border border-orange-500/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 font-bold">
                    <Download className="w-3.5 h-3.5 text-[var(--color-brand)] shrink-0" />
                    <span>{t('privacy.section5Downloadable', 'Dapat Diunduh (Download):')}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-tight">
                    {t('privacy.section5SalesDownloadDesc', 'Anda dapat mengunduh seluruh rekapan transaksi penjualan kapan saja ke dalam format arsip untuk keperluan laporan keuangan mandiri.')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{t('privacy.section5AutoDelete', 'Disimpan selama 3 bulan, setelah 3 bulan akan dihapus otomatis dari sistem.')}</span>
                </div>
              </div>

              {/* Card Histori Login */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs md:text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {t('privacy.section5LoginTitle', 'Histori Login')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {t('privacy.section5RetentionBadge', 'Retensi 3 Bulan')}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isEn ? (
                    <>
                      Logged for <strong className="font-bold text-[var(--text-primary)]">system security</strong> to track user session history, IP addresses, client browsers, and account access timestamps.
                    </>
                  ) : (
                    <>
                      Dicatat untuk <strong className="font-bold text-[var(--text-primary)]">keamanan sistem</strong>, mengidentifikasi riwayat sesi pengguna, alamat IP, peramban, dan waktu akses akun.
                    </>
                  )}
                </p>
                <div className="p-2.5 bg-[var(--bg-surface)] rounded-lg border border-blue-500/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{t('privacy.section5Downloadable', 'Dapat Diunduh (Download):')}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-tight">
                    {t('privacy.section5LoginDownloadDesc', 'Pemilik tenan dan admin dapat mengunduh log histori login untuk kebutuhan audit berkala dan pengecekan integritas akun.')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{t('privacy.section5AutoDelete', 'Disimpan selama 3 bulan, setelah 3 bulan akan dihapus otomatis dari sistem.')}</span>
                </div>
              </div>
            </div>

            {/* Note Kebijakan Penghapusan 3 Bulan */}
            <div className="p-3.5 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)] flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
              <Calendar className="w-4 h-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)]">{t('privacy.section5CycleNoticeTitle', 'Pemberitahuan Siklus Retensi 3 Bulan:')}</strong>
                <p className="mt-0.5 text-[var(--text-muted)]">
                  {t('privacy.section5CycleNoticeDesc', 'Untuk menjaga kecepatan sistem dan mematuhi asas minimasi data (data minimization), sistem menjalankan pembersihan berkala atas data transaksi penjualan dan histori login yang telah melewati batas waktu 3 bulan. Kami merekomendasikan pengguna mengunduh rekap bulanan sebelum masa 3 bulan berakhir.')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Kontak & Pengembang */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t('privacy.section6Title', '6. Kontak Pengembang & Pertanyaan Privasi')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('privacy.section6Subtitle', 'Hubungi kami jika ada pertanyaan, masukan, atau permohonan hak data pribadi')}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)] space-y-3">
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                {isEn ? (
                  <>
                    This application is engineered and maintained by <strong className="font-bold text-[var(--text-primary)]">Ferry Linton Hutapea</strong>. If you have questions regarding this privacy policy, data export requests, or account deactivation, you can directly reach out to:
                  </>
                ) : (
                  <>
                    Aplikasi ini dikembangkan dan dikelola oleh <strong className="font-bold text-[var(--text-primary)]">Ferry Linton Hutapea</strong>. Apabila Anda memiliki pertanyaan seputar kebijakan privasi, permohonan ekspor data, atau penonaktifan akun, Anda dapat langsung menghubungi:
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="mailto:ferrylinton@gmail.com"
                  className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[var(--color-brand)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                      {t('privacy.section6OfficialEmail', 'Email Resmi')}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-brand)] truncate block">
                      ferrylinton@gmail.com
                    </span>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                      {t('privacy.section6LocationLabel', 'Lokasi Pengembang')}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-[var(--text-primary)] truncate block">
                      {t('privacy.section6LocationValue', 'Laguboti, Toba, Sumatera Utara, Indonesia')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
