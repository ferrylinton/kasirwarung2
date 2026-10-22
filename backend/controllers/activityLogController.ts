import type { Response } from 'express';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    return;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'admin';
  const isShopOwner =
    user.role === 'SHOP_OWNER' ||
    user.role === 'pemilik' ||
    user.role === 'MANAGER';

  if (!isAdmin && !isShopOwner) {
    res.status(403).json({
      success: false,
      message: 'Hanya SHOP_OWNER dan ADMIN yang memiliki hak akses ke log aktivitas.',
    });
    return;
  }

  const {
    tenantId: queryTenantId,
    entity,
    action,
    search,
    startDate,
    endDate,
    page = '1',
    limit = '10',
  } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));

  const filter: Record<string, any> = {};

  // 1. Role-based tenant scoping
  if (!isAdmin) {
    // SHOP_OWNER can strictly only see their own store's logs
    const tId = safeObjectId(user.tenantId);
    if (!tId) {
      res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan dalam sesi akun' });
      return;
    }
    filter.tenantId = tId;
  } else if (queryTenantId && queryTenantId !== 'ALL' && queryTenantId !== 'all') {
    // ADMIN can filter by specific tenant or view all
    const tId = safeObjectId(String(queryTenantId));
    if (tId) {
      filter.tenantId = tId;
    }
  }

  // 2. Entity filter (PRODUK, KATEGORI, PENGGUNA, TOKO, REVOKE_TOKEN)
  if (entity && entity !== 'ALL' && entity !== 'all') {
    filter.entity = String(entity).toUpperCase();
  }

  // 3. Action filter (CREATE, UPDATE, DELETE, REVOKE_TOKEN, ACTIVATE, DEACTIVATE)
  if (action && action !== 'ALL' && action !== 'all') {
    filter.action = String(action).toUpperCase();
  }

  // 4. Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = String(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = String(endDate);
    }
  }

  // 5. Search keyword filter
  if (search && String(search).trim()) {
    const s = String(search).trim();
    filter.$or = [
      { entityName: { $regex: s, $options: 'i' } },
      { details: { $regex: s, $options: 'i' } },
      { userName: { $regex: s, $options: 'i' } },
      { userEmail: { $regex: s, $options: 'i' } },
      { tenantName: { $regex: s, $options: 'i' } },
    ];
  }

  const logsCol = getCollection('activity_logs');
  const tenantsCol = getCollection('tenants');

  // Check if seeding default logs is needed when completely empty
  const totalCountInDb = await logsCol.countDocuments({});
  if (totalCountInDb === 0) {
    const tenants = await tenantsCol.find({}).toArray();
    const primaryTenant = tenants[0] || {
      _id: new ObjectId('6ace8019cb267df584bd0001'),
      name: 'Warung Berkah Jaya',
    };

    const seedLogs = [
      {
        _id: new ObjectId(),
        tenantId: primaryTenant._id,
        tenantName: primaryTenant.name,
        userId: new ObjectId('6ace8019cb267df584bd0010'),
        userName: 'Haji Ahmad',
        userEmail: 'pemilik@warung.com',
        userRole: 'SHOP_OWNER',
        action: 'UPDATE',
        entity: 'TOKO',
        entityId: String(primaryTenant._id),
        entityName: primaryTenant.name,
        details: 'Memperbarui tarif PPN toko menjadi 11% (tipe persentase)',
        previousData: { taxEnabled: true, taxRate: 10, taxType: 'percentage' },
        newData: { taxEnabled: true, taxRate: 11, taxType: 'percentage' },
        ipAddress: '192.168.1.10',
        device: 'Google Chrome / macOS',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        _id: new ObjectId(),
        tenantId: primaryTenant._id,
        tenantName: primaryTenant.name,
        userId: new ObjectId('6ace8019cb267df584bd0010'),
        userName: 'Haji Ahmad',
        userEmail: 'pemilik@warung.com',
        userRole: 'SHOP_OWNER',
        action: 'CREATE',
        entity: 'PRODUK',
        entityId: 'prod-001',
        entityName: 'Indomie Goreng Spesial',
        details: 'Menambahkan produk baru: Indomie Goreng Spesial (SKU: IND-001, Stok: 150, Harga: Rp3.500)',
        newData: { name: 'Indomie Goreng Spesial', sku: 'IND-001', stock: 150, price: 3500 },
        ipAddress: '192.168.1.10',
        device: 'Google Chrome / macOS',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        _id: new ObjectId(),
        tenantId: primaryTenant._id,
        tenantName: primaryTenant.name,
        userId: new ObjectId('6ace8019cb267df584bd0010'),
        userName: 'Haji Ahmad',
        userEmail: 'pemilik@warung.com',
        userRole: 'SHOP_OWNER',
        action: 'CREATE',
        entity: 'KATEGORI',
        entityId: 'cat-001',
        entityName: 'Makanan Instan',
        details: 'Menambahkan kategori baru: Makanan Instan (Icon: 🍜)',
        newData: { name: 'Makanan Instan', icon: '🍜', color: '#F59E0B' },
        ipAddress: '192.168.1.10',
        device: 'Google Chrome / macOS',
        createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      },
      {
        _id: new ObjectId(),
        tenantId: primaryTenant._id,
        tenantName: primaryTenant.name,
        userId: new ObjectId('6ace8019cb267df584bd0010'),
        userName: 'Haji Ahmad',
        userEmail: 'pemilik@warung.com',
        userRole: 'SHOP_OWNER',
        action: 'CREATE',
        entity: 'PENGGUNA',
        entityId: 'user-kasir-01',
        entityName: 'Siti Rahma',
        details: 'Mendaftarkan akun kasir baru: Siti Rahma (siti_kasir, shift pagi 08:00 - 16:00)',
        newData: { name: 'Siti Rahma', username: 'siti_kasir', role: 'SHOP_CASHIER' },
        ipAddress: '192.168.1.10',
        device: 'Google Chrome / macOS',
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
      {
        _id: new ObjectId(),
        tenantId: primaryTenant._id,
        tenantName: primaryTenant.name,
        userId: new ObjectId('6ace8019cb267df584bd0010'),
        userName: 'Haji Ahmad',
        userEmail: 'pemilik@warung.com',
        userRole: 'SHOP_OWNER',
        action: 'REVOKE_TOKEN',
        entity: 'REVOKE_TOKEN',
        entityId: 'user-kasir-01',
        entityName: 'Siti Rahma',
        details: 'Mencabut (blacklist) sesi token aktif kasir Siti Rahma karena pergantian shift',
        ipAddress: '192.168.1.10',
        device: 'Google Chrome / macOS',
        createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
      },
    ];

    for (const item of seedLogs) {
      await logsCol.insertOne(item as any);
    }
  }

  // Count total matching filter
  const total = await logsCol.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limitNum));

  // Query logs with sorting newest first and pagination
  const logs = await logsCol
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .toArray();

  // Calculate scope-based summary counts for stat cards
  const baseScopeFilter: Record<string, any> = {};
  if (!isAdmin && user.tenantId) {
    baseScopeFilter.tenantId = safeObjectId(user.tenantId);
  } else if (queryTenantId && queryTenantId !== 'ALL' && queryTenantId !== 'all') {
    const tId = safeObjectId(String(queryTenantId));
    if (tId) baseScopeFilter.tenantId = tId;
  }

  const [totalProducts, totalCategories, totalUsers, totalStore, totalRevokes] =
    await Promise.all([
      logsCol.countDocuments({ ...baseScopeFilter, entity: 'PRODUK' }),
      logsCol.countDocuments({ ...baseScopeFilter, entity: 'KATEGORI' }),
      logsCol.countDocuments({ ...baseScopeFilter, entity: 'PENGGUNA' }),
      logsCol.countDocuments({ ...baseScopeFilter, entity: 'TOKO' }),
      logsCol.countDocuments({ ...baseScopeFilter, entity: 'REVOKE_TOKEN' }),
    ]);

  res.json({
    success: true,
    data: logs.map((l: any) => ({
      id: String(l._id),
      tenantId: l.tenantId ? String(l.tenantId) : null,
      tenantName: l.tenantName || 'Toko',
      userId: l.userId ? String(l.userId) : null,
      userName: l.userName || 'User',
      userEmail: l.userEmail || '-',
      userRole: l.userRole || 'SHOP_CASHIER',
      action: l.action,
      entity: l.entity,
      entityId: l.entityId || null,
      entityName: l.entityName || '-',
      details: l.details || '-',
      previousData: l.previousData || null,
      newData: l.newData || null,
      ipAddress: l.ipAddress || '127.0.0.1',
      device: l.device || 'Browser',
      createdAt: l.createdAt,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    stats: {
      totalAll: total,
      totalProducts,
      totalCategories,
      totalUsers,
      totalStore,
      totalRevokes,
    },
  });
}
