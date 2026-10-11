import bcrypt from 'bcryptjs';
import { getCollection } from '../config/db.ts';

export const INITIAL_PRODUCTS = [
  {
    sku: 'KW-IND-001',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan Instan',
    price: 3500,
    costPrice: 2800,
    stock: 84,
    iconType: 'noodle',
    bgTint: '#FDF8EE',
    iconColor: '#F59E0B',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-AQU-002',
    name: 'Aqua Air Mineral 600ml',
    category: 'Minuman',
    price: 4000,
    costPrice: 2900,
    stock: 42,
    iconType: 'water',
    bgTint: '#EEFBFD',
    iconColor: '#0EA5E9',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-ULT-003',
    name: 'Ultra Milk Cokelat 250ml',
    category: 'Minuman',
    price: 7500,
    costPrice: 5900,
    stock: 31,
    iconType: 'milk',
    bgTint: '#FDF8EE',
    iconColor: '#9A3412',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-MNY-004',
    name: 'Minyak Goreng Sania 2L',
    category: 'Sembako',
    price: 38000,
    costPrice: 34000,
    stock: 19,
    iconType: 'oil',
    bgTint: '#FCFCEB',
    iconColor: '#CA8A04',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-CHT-005',
    name: 'Chitato Sapi Panggang 68g',
    category: 'Camilan',
    price: 11500,
    costPrice: 9200,
    stock: 26,
    iconType: 'chips',
    bgTint: '#FDF3EB',
    iconColor: '#EA580C',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-BRS-006',
    name: 'Beras Ramos Setra 5kg',
    category: 'Sembako',
    price: 72000,
    costPrice: 65000,
    stock: 12,
    iconType: 'rice',
    bgTint: '#ECFDF5',
    iconColor: '#16A34A',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-TEH-007',
    name: 'Teh Botol Sosro 450ml',
    category: 'Minuman',
    price: 6000,
    costPrice: 4500,
    stock: 38,
    iconType: 'tea',
    bgTint: '#FDF8EE',
    iconColor: '#9A3412',
    createdAt: new Date().toISOString(),
  },
  {
    sku: 'KW-POC-008',
    name: 'Pocari Sweat 500ml',
    category: 'Minuman',
    price: 8500,
    costPrice: 6800,
    stock: 24,
    iconType: 'energy',
    bgTint: '#EFF6FF',
    iconColor: '#2563EB',
    createdAt: new Date().toISOString(),
  },
];

export async function seedInitialData(): Promise<void> {
  try {
    const usersCol = getCollection('users');
    const existingBudi = await usersCol.findOne({ email: 'budi@kasirwarung.id' });
    if (!existingBudi) {
      const passwordHash = await bcrypt.hash('kasir123', 10);
      await usersCol.insertMany([
        {
          name: 'Budi Santoso',
          email: 'budi@kasirwarung.id',
          passwordHash,
          role: 'kasir',
          shift: 'Shift Siang (08:00 - 16:00)',
          createdAt: new Date().toISOString(),
        },
        {
          name: 'Siti Aminah',
          email: 'siti@kasirwarung.id',
          passwordHash,
          role: 'pemilik',
          shift: 'Shift Sore (16:00 - 22:00)',
          createdAt: new Date().toISOString(),
        },
      ]);
      console.log('[Seed] Default cashier users created (budi@kasirwarung.id / kasir123)');
    }

    const productsCol = getCollection('products');
    const productCount = await productsCol.countDocuments();
    if (productCount === 0) {
      await productsCol.insertMany(INITIAL_PRODUCTS);
      console.log('[Seed] 8 Kasir Warung products seeded');
    }

    const ordersCol = getCollection('orders');
    const existingSavedOrder = await ordersCol.findOne({ invoiceNo: 'INV/2025/05/28-0041' });
    if (!existingSavedOrder) {
      const allProducts = await productsCol.find({}).toArray();
      const findProd = (sku: string) =>
        allProducts.find((p: any) => p.sku === sku) || INITIAL_PRODUCTS.find((p) => p.sku === sku)!;

      const beras = findProd('KW-BRS-006');
      const minyak = findProd('KW-MNY-004');
      const indomie = findProd('KW-IND-001');
      const teh = findProd('KW-TEH-007');

      await ordersCol.insertMany([
        {
          invoiceNo: 'INV/2025/05/28-0041',
          status: 'saved',
          timeLabel: '14:15',
          summaryLabel: '4 Item: Beras, Telur, Minyak...',
          cashierName: 'Budi Santoso',
          customerName: 'Bu Rina (Langganan RT 04)',
          paymentMethod: 'Belum Dibayar',
          items: [
            {
              productId: String((beras as any)._id || 'KW-BRS-006'),
              name: 'Beras Ramos Setra 5kg',
              price: 72000,
              qty: 1,
              iconType: 'rice',
              bgTint: '#ECFDF5',
              iconColor: '#16A34A',
            },
            {
              productId: String((indomie as any)._id || 'KW-IND-001'),
              name: 'Indomie Goreng Spesial',
              price: 3500,
              qty: 2,
              iconType: 'noodle',
              bgTint: '#FDF8EE',
              iconColor: '#F59E0B',
            },
            {
              productId: String((teh as any)._id || 'KW-TEH-007'),
              name: 'Teh Botol Sosro 450ml',
              price: 6000,
              qty: 1,
              iconType: 'tea',
              bgTint: '#FDF8EE',
              iconColor: '#9A3412',
            },
          ],
          subtotal: 85000,
          tax: 500,
          total: 85500,
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
          invoiceNo: 'INV/2025/05/28-0040',
          status: 'paid',
          timeLabel: '13:40',
          summaryLabel: '3 Item: Minyak Goreng, Aqua...',
          cashierName: 'Budi Santoso',
          customerName: 'Pak Hendra',
          paymentMethod: 'QRIS',
          items: [
            {
              productId: String((minyak as any)._id || 'KW-MNY-004'),
              name: 'Minyak Goreng Sania 2L',
              price: 38000,
              qty: 1,
              iconType: 'oil',
              bgTint: '#FCFCEB',
              iconColor: '#CA8A04',
            },
            {
              productId: String((indomie as any)._id || 'KW-IND-001'),
              name: 'Indomie Goreng Spesial',
              price: 3500,
              qty: 4,
              iconType: 'noodle',
              bgTint: '#FDF8EE',
              iconColor: '#F59E0B',
            },
          ],
          subtotal: 52000,
          tax: 5720,
          total: 57720,
          cashReceived: 57720,
          changeAmount: 0,
          createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        },
        {
          invoiceNo: 'INV/2025/05/28-0039',
          status: 'paid',
          timeLabel: '12:15',
          summaryLabel: '2 Item: Beras Ramos, Teh Botol',
          cashierName: 'Budi Santoso',
          customerName: 'Umum',
          paymentMethod: 'Tunai',
          items: [
            {
              productId: String((beras as any)._id || 'KW-BRS-006'),
              name: 'Beras Ramos Setra 5kg',
              price: 72000,
              qty: 1,
              iconType: 'rice',
              bgTint: '#ECFDF5',
              iconColor: '#16A34A',
            },
            {
              productId: String((teh as any)._id || 'KW-TEH-007'),
              name: 'Teh Botol Sosro 450ml',
              price: 6000,
              qty: 2,
              iconType: 'tea',
              bgTint: '#FDF8EE',
              iconColor: '#9A3412',
            },
          ],
          subtotal: 84000,
          tax: 9240,
          total: 93240,
          cashReceived: 100000,
          changeAmount: 6760,
          createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        },
      ]);
      console.log('[Seed] Initial saved & completed orders seeded');
    }
  } catch (err) {
    console.warn('[Seed] Seed warning:', err);
  }
}
