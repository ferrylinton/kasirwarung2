# Kasir Warung POS

Aplikasi Point of Sale (POS) modern untuk Warung dan Toko Kelontong, dibuat dengan **Express.js (Backend)**, **React.js (Frontend)**, **Native MongoDB Driver**, **Upstash Redis** (untuk Token Bucket rate limiter dan JWT Token Blacklist), **Zod** untuk validasi skema, **JWT dengan Refresh Token**, dan **Radix UI Select** untuk dropdown kategori.

## Struktur Folder

```
my-app/
├── backend/                  # Express.js Backend
│   ├── config/               # Database (MongoDB Native), Redis (Upstash), Mailer (SMTP), Env
│   ├── controllers/          # Handlers: Auth, Products, Orders, Reports
│   ├── middleware/           # JWT Auth, Rate Limiter, Zod Validation, Error Handler
│   ├── models/               # Zod Schemas & Database Seeders
│   ├── routes/               # Express API Endpoints (/api/auth, /api/products, /api/orders, /api/reports)
│   ├── utils/                # JWT Token Helper, Invoice Generator
│   ├── server.ts             # Express Server Entry Point
│   └── package.json          # Backend Dependencies
│
├── frontend/                 # React Frontend (Vite)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── assets/           # Media & icons
│   │   ├── components/       # Radix UI Select, Sidebar, ProductCard, OrderDrawer, PaymentModal, etc.
│   │   ├── context/          # AuthContext & CartContext
│   │   ├── hooks/            # useIdleTimer (Auto-Logout 5 menit)
│   │   ├── pages/            # PosPage (Sesuai Desain), LoginPage, ReportPage
│   │   ├── services/         # API Client dengan Auto Refresh Token
│   │   ├── App.tsx           # Main Frontend App Component
│   │   └── main.tsx          # React DOM mounting
│   └── package.json          # Frontend Dependencies
│
├── .env                      # Environment Variables (MongoDB, Redis, JWT, SMTP)
├── .env.example              # Template Environment Variables
├── .gitignore                # Global Git Ignore
├── README.md                 # Dokumentasi Lengkap
├── server.ts                 # Full-stack Runner (Express + Vite)
└── package.json              # Root package runner
```

## Fitur Utama

1. **Tampilan Kasir POS Sesuai Desain (Pixel-Accurate)**:
   - Sidebar navigasi gelap (`#181A1F`) dengan logo belanja oranye (`#EC6C1A`), tombol Kasir aktif dengan badge item, inventaris stok, riwayat, dan tombol logout merah.
   - Kolom atas: Judul *Kasir Warung*, input pencarian *Kata kunci*, dan profil kasir *Budi Santoso*.
   - Bagian *PESANAN DISIMPAN (BELUM DIBAYAR)*: Menampilkan kartu nota tersimpan (misal `INV/2025/05/28-0041` Rp85.500) dan kartu dashed *Buka Transaksi Baru* dengan shortcut keyboard `Shift + N`.
   - Filter Kategori menggunakan komponen **Radix UI Select** (`@radix-ui/react-select`).
   - Kartu produk 4 kolom dengan visual ikon khas warung (Indomie, Aqua, Ultra Milk, Minyak Sania, Chitato, Beras Ramos, Teh Sosro, Pocari Sweat), badge stok, dan stepper kuantitas `- qty +`. Kartu dengan kuantitas aktif disorot dengan bingkai hijau (`#16A34A`).
   - Panel kanan (*Pesanan*): Nomor nota monospace (`INV/2025/05/28-0042`), daftar belanjaan, tombol tahan/simpan pesanan (`||`), tombol hapus keranjang, rincian subtotal, PPN 11%, dan tombol hijau bayar.

2. **Autentikasi JWT & Keamanan Tingkat Tinggi**:
   - Access Token (15 menit) + Refresh Token (1 hari) disimpan dalam HTTP cookie dan local storage.
   - Token Blacklist di **Upstash Redis** saat logout atau token dicabut.
   - Auto-Logout saat inaktivitas selama `IDLE_TIMEOUT_MINUTES` (default 5 menit) dengan modal hitung mundur (countdown warning modal).

3. **Rate Limiting Token Bucket via Redis**:
   - Algoritma Token Bucket backed by Redis mencegah brute force pada `/api/auth/*` dan flood pada API produk & transaksi.

4. **Kirim Struk Otomatis via SMTP**:
   - Terintegrasi dengan server SMTP untuk mengirim struk digital ke email pelanggan setelah pembayaran selesai.

5. **Responsif Desktop, Tablet & Mobile**:
   - Tampilan adaptif pada layar lebar hingga mobile dengan laci keranjang mengambang.
