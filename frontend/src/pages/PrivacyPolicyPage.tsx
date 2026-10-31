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
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar.tsx';
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
    <div className={`flex-1 flex flex-col h-full bg-[#F5F6F8] font-sans ${isModal ? 'p-0' : 'overflow-hidden'}`}>
      {/* Top Navbar if rendered as full page and logged in */}
      {!isModal && user && (
        <TopNavbar currentTab="privacy-policy" />
      )}

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/70 text-orange-800 text-[11px] font-semibold tracking-wide uppercase mb-1">
                    Dokumen Resmi
                  </div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Kebijakan Privasi
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Transparansi pengelolaan data, keamanan enkripsi, dan retensi informasi Kasir Warung
                  </p>
                </div>
              </div>

              {/* Action: Kembali */}
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-center"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Kembali</span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Terakhir diperbarui: 31 Oktober 2026
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Berlaku untuk Tenan, Staf Kasir, & Administrator
              </span>
            </div>
          </div>

          {/* Section 1: Data Akun & Login */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. Data Nama, Email, & Autentikasi Akun
                </h2>
                <p className="text-xs text-slate-500">
                  Digunakan khusus untuk proses masuk (login) dan verifikasi identitas akun
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-slate-600 leading-relaxed space-y-2">
              <p>
                Kami mengumpulkan data berupa <strong>Nama Pengguna</strong> dan <strong>Alamat Email</strong> ketika Anda mendaftarkan akun toko (tenan) maupun saat staf kasir ditambahkan ke dalam sistem:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong>Autentikasi & Akses:</strong> Email digunakan sebagai pengenal utama untuk proses masuk (login) ke aplikasi.
                </li>
                <li>
                  <strong>Verifikasi Akun & Keamanan:</strong> Email digunakan untuk mengirimkan tautan verifikasi pendaftaran tenan, konfirmasi pengaktifan kembali toko (reactivation), serta notifikasi keamanan penting.
                </li>
                <li>
                  Kami tidak membagikan, memperjualbelikan, atau mengalihkan alamat email dan nama Anda kepada pihak ketiga manapun untuk tujuan pemasaran.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Password & Enkripsi Bcrypt */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. Keamanan Password & Enkripsi Bcrypt
                </h2>
                <p className="text-xs text-slate-500">
                  Perlindungan kata sandi tingkat tinggi tanpa penyimpanan teks terbuka
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <span className="font-bold">Standar Enkripsi Satu Arah (One-Way Hash):</span>
                <p>
                  Kata sandi Anda <strong>disimpan setelah dienkripsi menggunakan algoritma bcrypt</strong> (dengan salt rounds adaptif). Sistem maupun pengembang tidak pernah menyimpan ataupun mengetahui kata sandi asli (plain text) Anda.
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Bahkan apabila terjadi upaya pembacaan basis data tanpa izin, kata sandi Anda tetap terlindungi karena proses enkripsi satu arah tidak dapat dibalik menjadi kata sandi asli. Setiap verifikasi login dilakukan dengan mencocokkan hash bcrypt secara matematis.
            </p>
          </div>

          {/* Section 3: Data Peramban (Browser) & Keamanan Sistem */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. Data Peramban (Browser) untuk Keamanan
                </h2>
                <p className="text-xs text-slate-500">
                  Informasi teknis peramban dicatat demi mencegah akses tidak sah
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-slate-600 leading-relaxed space-y-2">
              <p>
                Saat Anda mengakses atau melakukan login ke aplikasi, sistem secara otomatis mencatat informasi teknis:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    Data Browser & User-Agent
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    Tipe peramban (Chrome, Firefox, Safari, Edge), versi, dan sistem operasi yang digunakan untuk mengakses aplikasi.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Tujuan Keamanan
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    Mendeteksi sesi aktif ganda, mencegah serangan pembajakan sesi (session hijacking), dan melindungi toko dari aktivitas mencurigakan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Data Produk & Kategori */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  4. Data Produk & Kategori Produk
                </h2>
                <p className="text-xs text-slate-500">
                  Disimpan untuk operasional katalog dan transaksi kasir harian
                </p>
              </div>
            </div>

            <div className="text-xs md:text-sm text-slate-600 leading-relaxed space-y-2">
              <p>
                Data katalog yang Anda masukkan — meliputi <strong>nama produk, barcode/SKU, kategori produk, harga modal, harga jual, dan jumlah stok</strong> — disimpan secara aman dalam basis data aplikasi terisolasi per tenan.
              </p>
              <p className="text-slate-600">
                Data ini sepenuhnya milik tenan Anda dan digunakan semata-mata untuk mengoperasikan fungsi kasir Point of Sale (POS), pencarian barcode, dan kalkulasi total belanja pelanggan di warung Anda.
              </p>
            </div>
          </div>

          {/* Section 5: Retensi 3 Bulan & Unduh Data (Penjualan & Login) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  5. Histori Penjualan & Histori Login (Retensi 3 Bulan & Fitur Unduh)
                </h2>
                <p className="text-xs text-slate-500">
                  Kebijakan retensi transparan, hak pengunduhan data, dan pembersihan otomatis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Card Histori Penjualan */}
              <div className="p-4 rounded-xl border border-orange-200/80 bg-orange-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs md:text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    Histori Penjualan
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold text-[10px]">
                    Retensi 3 Bulan
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Digunakan untuk <strong>keperluan analitik performa penjualan</strong>, laporan omzet harian/bulanan, dan pembukuan toko.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-orange-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-orange-800 font-bold">
                    <Download className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Dapat Diunduh (Download):</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">
                    Anda dapat mengunduh seluruh rekapan transaksi penjualan kapan saja ke dalam format arsip untuk keperluan laporan keuangan mandiri.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Disimpan selama 3 bulan, setelah 3 bulan akan dihapus otomatis dari sistem.</span>
                </div>
              </div>

              {/* Card Histori Login */}
              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs md:text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Histori Login
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Retensi 3 Bulan
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dicatat untuk <strong>keamanan sistem</strong>, mengidentifikasi riwayat sesi pengguna, alamat IP, peramban, dan waktu akses akun.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                    <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Dapat Diunduh (Download):</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">
                    Pemilik tenan dan admin dapat mengunduh log histori login untuk kebutuhan audit berkala dan pengecekan integritas akun.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Disimpan selama 3 bulan, setelah 3 bulan akan dihapus otomatis dari sistem.</span>
                </div>
              </div>
            </div>

            {/* Note Kebijakan Penghapusan 3 Bulan */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Pemberitahuan Siklus Retensi 3 Bulan:</strong>
                <p className="mt-0.5 text-slate-500">
                  Untuk menjaga kecepatan sistem dan mematuhi asas minimasi data (data minimization), sistem menjalankan pembersihan berkala atas data transaksi penjualan dan histori login yang telah melewati batas waktu 3 bulan. Kami merekomendasikan pengguna mengunduh rekap bulanan sebelum masa 3 bulan berakhir.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Kontak & Pengembang */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  6. Kontak Pengembang & Pertanyaan Privasi
                </h2>
                <p className="text-xs text-slate-500">
                  Hubungi kami jika ada pertanyaan, masukan, atau permohonan hak data pribadi
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                Aplikasi ini dikembangkan dan dikelola oleh <strong>Ferry Linton Hutapea</strong>. Apabila Anda memiliki pertanyaan seputar kebijakan privasi, permohonan ekspor data, atau penonaktifan akun, Anda dapat langsung menghubungi:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="mailto:ferrylinton@gmail.com"
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Email Resmi
                    </span>
                    <span className="text-xs md:text-sm font-bold text-slate-800 group-hover:text-orange-600 truncate block">
                      ferrylinton@gmail.com
                    </span>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Lokasi Pengembang
                    </span>
                    <span className="text-xs md:text-sm font-bold text-slate-800 truncate block">
                      Laguboti, Toba, Sumatera Utara, Indonesia
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
