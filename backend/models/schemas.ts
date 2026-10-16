import { z } from 'zod';

// 1. Auth & Multi-Tenant Validation Schemas
export const loginSchema = z.object({
  email: z.string().min(1, 'Email atau username wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(60),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['ADMIN', 'SHOP_OWNER', 'SHOP_CASHIER', 'kasir', 'admin', 'pemilik']).default('SHOP_CASHIER'),
});

// Pendaftaran Akun Tenan Baru oleh SHOP_OWNER
export const registerTenantSchema = z.object({
  shopName: z.string().min(3, 'Nama toko minimal 3 karakter').max(80),
  ownerEmail: z.string().email('Format email pemilik toko tidak valid'),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username hanya boleh huruf, angka, titik, atau underscore'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// Tambah / Ubah Kasir oleh SHOP_OWNER
export const createCashierSchema = z.object({
  name: z.string().min(2, 'Nama kasir minimal 2 karakter').max(60),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username hanya boleh huruf, angka, titik, atau underscore'),
  email: z.string().email('Format email kasir tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  shift: z.string().default('Shift Pagi (08:00 - 16:00)'),
});

export const updateCashierSchema = z.object({
  name: z.string().min(2, 'Nama kasir minimal 2 karakter').max(60).optional(),
  shift: z.string().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
});

// Permintaan Penonaktifan & Pengaktifan Kembali Tenan
export const requestDeactivationSchema = z.object({
  reason: z.string().min(5, 'Alasan penonaktifan minimal 5 karakter'),
});

export const reviewDeactivationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectReason: z.string().optional(),
});

export const requestReactivationSchema = z.object({
  email: z.string().email('Format email pemilik toko tidak valid'),
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
  reason: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

// 2. Product & Category Validation Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50),
  description: z.string().max(200).optional(),
  icon: z.string().optional().default('📦'),
  color: z.string().optional().default('#F59E0B'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  sku: z.string().min(2, 'SKU wajib diisi'),
  category: z.string().min(1, 'Kategori produk wajib diisi'),
  price: z.number().int().positive('Harga harus lebih dari 0'),
  costPrice: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative('Stok tidak boleh negatif'),
  iconType: z
    .enum(['noodle', 'water', 'milk', 'oil', 'chips', 'rice', 'tea', 'energy', 'box'])
    .default('box'),
  bgTint: z.string().default('#FDF8EE'),
  iconColor: z.string().default('#D97706'),
  imageUrl: z.string().optional(),
});

export const updateStockSchema = z.object({
  stock: z.number().int().nonnegative('Stok tidak boleh negatif'),
  price: z.number().int().positive().optional(),
  name: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
});

// 3. Order / Transaction Validation Schemas
export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  iconType: z.string().optional(),
  bgTint: z.string().optional(),
  iconColor: z.string().optional(),
});

export const createOrderSchema = z.object({
  invoiceNo: z.string().min(3),
  status: z.enum(['saved', 'paid', 'cancelled']),
  items: z.array(orderItemSchema).min(1, 'Minimal 1 produk dalam pesanan'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  paymentMethod: z.string().optional().default('Tunai'),
  cashReceived: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
