import { z } from 'zod';

// 1. Auth Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(60),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['kasir', 'admin', 'pemilik']).default('kasir'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

// 2. Product Validation Schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  sku: z.string().min(2, 'SKU wajib diisi'),
  category: z.enum(['Makanan Instan', 'Minuman', 'Sembako', 'Camilan', 'Kebutuhan Rumah']),
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
  category: z.enum(['Makanan Instan', 'Minuman', 'Sembako', 'Camilan', 'Kebutuhan Rumah']).optional(),
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
  paymentMethod: z.enum(['Tunai', 'QRIS', 'Transfer', 'Belum Dibayar']).default('Tunai'),
  cashReceived: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
