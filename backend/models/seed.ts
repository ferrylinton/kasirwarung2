import bcrypt from 'bcryptjs';
import { getCollection, ObjectId } from '../config/db.ts';

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
    const tenantsCol = getCollection('tenants');
    const usersCol = getCollection('users');
    const productsCol = getCollection('products');
    const ordersCol = getCollection('orders');

    // 1. Seed Tenants
    let tenant1 = await tenantsCol.findOne({ code: 'T-WARUNG-01' });
    if (!tenant1) {
      const tenant1Id = new ObjectId('6ace8019cb267df584bd0001');
      await tenantsCol.insertOne({
        _id: tenant1Id,
        name: 'Warung Berkah Budi',
        code: 'T-WARUNG-01',
        ownerEmail: 'budi@kasirwarung.id',
        status: 'active',
        taxEnabled: true,
        taxRate: 11,
        taxType: 'percentage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      tenant1 = await tenantsCol.findOne({ _id: tenant1Id });
    }

    let tenant2 = await tenantsCol.findOne({ code: 'T-TOKO-02' });
    if (!tenant2) {
      const tenant2Id = new ObjectId('6ace8019cb267df584bd0002');
      await tenantsCol.insertOne({
        _id: tenant2Id,
        name: 'Toko Kelontong Sejahtera',
        code: 'T-TOKO-02',
        ownerEmail: 'hendra@kelontong.id',
        status: 'active',
        taxEnabled: true,
        taxRate: 11,
        taxType: 'percentage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      tenant2 = await tenantsCol.findOne({ _id: tenant2Id });
    }

    const t1Id = tenant1 ? tenant1._id : new ObjectId('6ace8019cb267df584bd0001');
    const t2Id = tenant2 ? tenant2._id : new ObjectId('6ace8019cb267df584bd0002');

    // 2. Seed Users
    const existingAdmin = await usersCol.findOne({ email: 'admin@kasirwarung.id' });
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await usersCol.insertOne({
        _id: new ObjectId('6ace8019cb267df584bd00a1'),
        name: 'Super Administrator',
        username: 'admin',
        email: 'admin@kasirwarung.id',
        passwordHash: adminHash,
        role: 'ADMIN',
        shift: 'Shift Pusat',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      console.log('[Seed] Super Admin created (admin@kasirwarung.id / admin123)');
    }

    const existingBudi = await usersCol.findOne({ email: 'budi@kasirwarung.id' });
    if (!existingBudi) {
      const ownerHash = await bcrypt.hash('kasir123', 10);
      await usersCol.insertMany([
        {
          _id: new ObjectId('6ace8019cb267df584bd00a8'),
          tenantId: t1Id,
          name: 'Budi Santoso',
          username: 'budi',
          email: 'budi@kasirwarung.id',
          passwordHash: ownerHash,
          role: 'SHOP_OWNER',
          shift: 'Shift Siang (08:00 - 16:00)',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          _id: new ObjectId('6ace8019cb267df584bd00a9'),
          tenantId: t1Id,
          name: 'Siti Aminah',
          username: 'siti',
          email: 'siti@kasirwarung.id',
          passwordHash: ownerHash,
          role: 'SHOP_CASHIER',
          shift: 'Shift Sore (16:00 - 22:00)',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          _id: new ObjectId('6ace8019cb267df584bd00b5'),
          tenantId: t2Id,
          name: 'Hendra Gunawan',
          username: 'hendra',
          email: 'hendra@kelontong.id',
          passwordHash: ownerHash,
          role: 'SHOP_OWNER',
          shift: 'Shift Pagi (08:00 - 17:00)',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]);
      console.log('[Seed] Multi-tenant users created');
    } else {
      // Ensure roles are updated to SHOP_OWNER / SHOP_CASHIER with tenantId
      await usersCol.updateOne(
        { email: 'budi@kasirwarung.id' },
        { $set: { role: 'SHOP_OWNER', tenantId: t1Id, username: 'budi' } }
      );
      await usersCol.updateOne(
        { email: 'siti@kasirwarung.id' },
        { $set: { role: 'SHOP_CASHIER', tenantId: t1Id, username: 'siti' } }
      );
    }

    const existingHendra = await usersCol.findOne({ email: 'hendra@kelontong.id' });
    if (!existingHendra) {
      const ownerHash = await bcrypt.hash('kasir123', 10);
      await usersCol.insertOne({
        _id: new ObjectId('6ace8019cb267df584bd00b5'),
        tenantId: t2Id,
        name: 'Hendra Gunawan',
        username: 'hendra',
        email: 'hendra@kelontong.id',
        passwordHash: ownerHash,
        role: 'SHOP_OWNER',
        shift: 'Shift Pagi (08:00 - 17:00)',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      console.log('[Seed] Hendra created for Tenant 2');
    }

    // 3. Seed Products with tenantId
    const productCount = await productsCol.countDocuments({ tenantId: t1Id });
    if (productCount === 0) {
      const t1Products = INITIAL_PRODUCTS.map((p) => ({
        ...p,
        _id: new ObjectId(),
        tenantId: t1Id,
      }));
      await productsCol.insertMany(t1Products);

      // Seed separate products for Tenant 2 to demonstrate multi-tenant data isolation
      const t2Products = [
        {
          _id: new ObjectId(),
          tenantId: t2Id,
          sku: 'TK-KOP-001',
          name: 'Kopi Kapal Api Spesial 165g',
          category: 'Minuman',
          price: 14500,
          costPrice: 12000,
          stock: 45,
          iconType: 'tea',
          bgTint: '#FDF8EE',
          iconColor: '#9A3412',
          createdAt: new Date().toISOString(),
        },
        {
          _id: new ObjectId(),
          tenantId: t2Id,
          sku: 'TK-GUL-002',
          name: 'Gula Pasir Gulaku 1kg',
          category: 'Sembako',
          price: 18000,
          costPrice: 15500,
          stock: 30,
          iconType: 'rice',
          bgTint: '#ECFDF5',
          iconColor: '#16A34A',
          createdAt: new Date().toISOString(),
        },
        {
          _id: new ObjectId(),
          tenantId: t2Id,
          sku: 'TK-TEL-003',
          name: 'Telur Ayam Negeri 1kg',
          category: 'Sembako',
          price: 29000,
          costPrice: 26000,
          stock: 22,
          iconType: 'oil',
          bgTint: '#FCFCEB',
          iconColor: '#CA8A04',
          createdAt: new Date().toISOString(),
        },
      ];
      await productsCol.insertMany(t2Products);
      console.log('[Seed] Multi-tenant products seeded for Tenant 1 and Tenant 2');
    }

    // 4. Seed Orders with tenantId
    const existingSavedOrder = await ordersCol.findOne({ invoiceNo: 'INV/2025/05/28-0041' });
    if (!existingSavedOrder) {
      const allProducts = await productsCol.find({ tenantId: t1Id }).toArray();
      const findProd = (sku: string) =>
        allProducts.find((p: any) => p.sku === sku) || INITIAL_PRODUCTS.find((p) => p.sku === sku)!;

      const beras = findProd('KW-BRS-006');
      const minyak = findProd('KW-MNY-004');
      const indomie = findProd('KW-IND-001');
      const teh = findProd('KW-TEH-007');

      await ordersCol.insertMany([
        {
          _id: new ObjectId(),
          tenantId: t1Id,
          invoiceNo: 'INV/2025/05/28-0041',
          status: 'saved',
          timeLabel: '14:15',
          summaryLabel: '3 Item: Beras, Indomie, Teh...',
          cashierName: 'Budi Santoso',
          customerName: 'Bu Rina (Langganan RT 04)',
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
          _id: new ObjectId(),
          tenantId: t1Id,
          invoiceNo: 'INV/2025/05/28-0040',
          status: 'paid',
          timeLabel: '13:40',
          summaryLabel: '2 Item: Minyak Goreng, Indomie...',
          cashierName: 'Budi Santoso',
          customerName: 'Pak Hendra',
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
      ]);
      console.log('[Seed] Initial saved & completed orders seeded for Tenant 1');
    }

    const t2Order = await ordersCol.findOne({ tenantId: t2Id });
    if (!t2Order) {
      await ordersCol.insertOne({
        _id: new ObjectId(),
        tenantId: t2Id,
        invoiceNo: 'INV/2025/05/28-0099',
        status: 'paid',
        timeLabel: '15:10',
        summaryLabel: '2 Item: Kopi Kapal Api, Gula Pasir...',
        cashierName: 'Hendra Gunawan',
        customerName: 'Ibu Dewi',
        items: [
          {
            productId: 'TK-KOP-001',
            name: 'Kopi Kapal Api Spesial 165g',
            price: 14500,
            qty: 2,
            iconType: 'tea',
            bgTint: '#FDF8EE',
            iconColor: '#9A3412',
          },
          {
            productId: 'TK-GUL-002',
            name: 'Gula Pasir Gulaku 1kg',
            price: 18000,
            qty: 1,
            iconType: 'rice',
            bgTint: '#ECFDF5',
            iconColor: '#16A34A',
          },
        ],
        subtotal: 47000,
        tax: 5170,
        total: 52170,
        cashReceived: 60000,
        changeAmount: 7830,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      });
      console.log('[Seed] Completed order seeded for Tenant 2');
    }

    // Ensure any legacy orders without tenantId are assigned to t1Id (Warung Berkah Budi)
    await ordersCol.updateMany(
      { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
      { $set: { tenantId: t1Id } }
    );

    // Remove legacy paymentMethod from all existing orders
    // 4. Seed Initial Login History if empty
    const historyCol = getCollection('login_history');
    const historyCount = await historyCol.countDocuments({});
    if (historyCount === 0) {
      const now = Date.now();
      await historyCol.insertMany([
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a1'),
          tenantId: null,
          tenantName: 'Platform Administrator',
          name: 'Super Administrator',
          username: 'admin',
          email: 'admin@kasirwarung.id',
          role: 'ADMIN',
          ipAddress: '182.253.14.88 (Kantor Pusat Jakarta)',
          device: 'Chrome 124 (macOS Sonoma)',
          status: 'Berhasil',
          createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a8'),
          tenantId: t1Id,
          tenantName: 'Warung Berkah Budi',
          name: 'Budi Santoso',
          username: 'budi',
          email: 'budi@kasirwarung.id',
          role: 'SHOP_OWNER',
          ipAddress: '192.168.1.100 (Warung POS Terminal)',
          device: 'POS Terminal Touchscreen (Linux POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a9'),
          tenantId: t1Id,
          tenantName: 'Warung Berkah Budi',
          name: 'Siti Aminah',
          username: 'siti',
          email: 'siti@kasirwarung.id',
          role: 'SHOP_CASHIER',
          ipAddress: '192.168.1.102 (Kasir Meja 1)',
          device: 'Chrome 124 (Windows 11 POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00b5'),
          tenantId: t2Id,
          tenantName: 'Toko Kelontong Sejahtera',
          name: 'Hendra Gunawan',
          username: 'hendra',
          email: 'hendra@kelontong.id',
          role: 'SHOP_OWNER',
          ipAddress: '192.168.2.50 (Kelontong Terminal)',
          device: 'Safari 17 (iPadOS Tablet POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a9'),
          tenantId: t1Id,
          tenantName: 'Warung Berkah Budi',
          name: 'Siti Aminah',
          username: 'siti',
          email: 'siti@kasirwarung.id',
          role: 'SHOP_CASHIER',
          ipAddress: '192.168.1.102 (Kasir Meja 1)',
          device: 'Chrome 124 (Windows 11 POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 24 * 3600 * 1000 - 10 * 60 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a8'),
          tenantId: t1Id,
          tenantName: 'Warung Berkah Budi',
          name: 'Budi Santoso',
          username: 'budi',
          email: 'budi@kasirwarung.id',
          role: 'SHOP_OWNER',
          ipAddress: '182.1.22.45 (Telkomsel 5G)',
          device: 'Chrome Mobile (Samsung Galaxy Tab)',
          status: 'Berhasil',
          createdAt: new Date(now - 26 * 3600 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00b5'),
          tenantId: t2Id,
          tenantName: 'Toko Kelontong Sejahtera',
          name: 'Hendra Gunawan',
          username: 'hendra',
          email: 'hendra@kelontong.id',
          role: 'SHOP_OWNER',
          ipAddress: '192.168.2.50 (Kelontong Terminal)',
          device: 'Safari 17 (iPadOS Tablet POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
        },
        {
          _id: new ObjectId(),
          userId: new ObjectId('6ace8019cb267df584bd00a8'),
          tenantId: t1Id,
          tenantName: 'Warung Berkah Budi',
          name: 'Budi Santoso',
          username: 'budi',
          email: 'budi@kasirwarung.id',
          role: 'SHOP_OWNER',
          ipAddress: '192.168.1.100 (Warung POS Terminal)',
          device: 'POS Terminal Touchscreen (Linux POS)',
          status: 'Berhasil',
          createdAt: new Date(now - 72 * 3600 * 1000).toISOString(),
        },
      ]);
      console.log('[Seed] Multi-tenant login history seeded');
    }
  } catch (err) {
    console.warn('[Seed] Seed warning:', err);
  }
}
