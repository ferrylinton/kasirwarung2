import type { Response } from 'express';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { recordActivity } from '../services/activityLogService.ts';

export async function getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { search, category, tenantId: queryTenantId } = req.query;
  const productsCol = getCollection('products');

  const filter: Record<string, any> = {};

  // Multi-tenant scoping
  if (req.user?.role === 'ADMIN') {
    if (queryTenantId && queryTenantId !== 'ALL' && queryTenantId !== 'all') {
      const tId = safeObjectId(String(queryTenantId));
      if (tId) filter.tenantId = tId;
    }
  } else if (req.user?.tenantId) {
    const tId = safeObjectId(req.user.tenantId);
    if (tId) filter.tenantId = tId;
  } else if (queryTenantId && queryTenantId !== 'ALL' && queryTenantId !== 'all') {
    const tId = safeObjectId(String(queryTenantId));
    if (tId) filter.tenantId = tId;
  } else {
    // Default fallback to first tenant for initial pre-login state
    filter.tenantId = new ObjectId('6ace8019cb267df584bd0001');
  }

  if (category && category !== 'Semua Produk') {
    filter.category = String(category);
  }

  if (search) {
    filter.$or = [
      { name: { $regex: String(search), $options: 'i' } },
      { sku: { $regex: String(search), $options: 'i' } },
    ];
  }

  const products = await productsCol.find(filter).toArray();
  const tenantsCol = getCollection('tenants');
  const tenantsList = await tenantsCol.find({}).toArray();
  const tenantMap = new Map(tenantsList.map((t: any) => [String(t._id), t]));

  res.json({
    success: true,
    data: products.map((p: any) => {
      const t = p.tenantId ? tenantMap.get(String(p.tenantId)) : null;
      return {
        id: String(p._id),
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice || Math.round(p.price * 0.8),
        stock: p.stock,
        iconType: p.iconType || 'box',
        bgTint: p.bgTint || '#FDF8EE',
        iconColor: p.iconColor || '#F59E0B',
        imageUrl: p.imageUrl || null,
        tenantId: p.tenantId ? String(p.tenantId) : undefined,
        tenantName: t?.name || (p.tenantId ? 'Tenan ' + String(p.tenantId).slice(-4) : 'Warung Utama'),
        tenantCode: t?.code || '',
      };
    }),
  });
}

export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa menambah data produk.',
    });
    return;
  }

  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan dalam sesi' });
    return;
  }

  const tenantId = new ObjectId(req.user.tenantId);
  const productsCol = getCollection('products');
  const newProductId = new ObjectId();

  await productsCol.insertOne({
    _id: newProductId,
    tenantId,
    ...req.body,
    createdAt: new Date().toISOString(),
  });

  await recordActivity(req, {
    action: 'CREATE',
    entity: 'PRODUK',
    entityId: newProductId,
    entityName: req.body.name || 'Produk Baru',
    details: `Menambahkan produk baru "${req.body.name}" (SKU: ${req.body.sku || '-'}, Kategori: ${req.body.category || '-'}, Stok: ${req.body.stock}, Harga: Rp${Number(req.body.price || 0).toLocaleString('id-ID')})`,
    newData: req.body,
  });

  const createdMsg = (req as any).t ? (req as any).t('product.created', 'Produk berhasil ditambahkan ke inventaris toko') : 'Produk berhasil ditambahkan ke inventaris toko';
  res.status(201).json({
    success: true,
    message: createdMsg,
    data: { id: String(newProductId), ...req.body, tenantId: String(tenantId) },
  });
}

export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    const msg = (req as any).t ? (req as any).t('common.forbidden', 'Hanya role SHOP_OWNER yang bisa mengubah data produk.') : 'Hanya role SHOP_OWNER yang bisa mengubah data produk.';
    res.status(403).json({
      success: false,
      message: msg,
    });
    return;
  }

  const { id } = req.params;
  const prodId = safeObjectId(id);
  if (!prodId) {
    const msg = (req as any).t ? (req as any).t('common.invalidInput', 'ID produk tidak valid') : 'ID produk tidak valid';
    res.status(400).json({ success: false, message: msg });
    return;
  }
  const productsCol = getCollection('products');

  const filter: Record<string, any> = { _id: prodId };
  if (req.user?.tenantId) {
    const tId = safeObjectId(req.user.tenantId);
    if (tId) filter.tenantId = tId;
  }

  const existing = await productsCol.findOne(filter);
  if (!existing) {
    const msg = (req as any).t ? (req as any).t('common.notFound', 'Produk tidak ditemukan di toko Anda') : 'Produk tidak ditemukan di toko Anda';
    res.status(404).json({ success: false, message: msg });
    return;
  }

  await productsCol.updateOne(filter, {
    $set: { ...req.body, updatedAt: new Date().toISOString() },
  });

  const updated = await productsCol.findOne(filter);

  await recordActivity(req, {
    action: 'UPDATE',
    entity: 'PRODUK',
    entityId: existing._id,
    entityName: req.body.name || existing.name,
    details: `Memperbarui produk "${existing.name}" (Stok: ${req.body.stock !== undefined ? req.body.stock : existing.stock}, Harga: Rp${Number(req.body.price !== undefined ? req.body.price : existing.price).toLocaleString('id-ID')})`,
    previousData: existing,
    newData: req.body,
  });

  const updatedMsg = (req as any).t ? (req as any).t('product.updated', 'Data produk berhasil diperbarui') : 'Data produk berhasil diperbarui';
  res.json({
    success: true,
    message: updatedMsg,
    data: updated,
  });
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    const msg = (req as any).t ? (req as any).t('common.forbidden', 'Hanya role SHOP_OWNER yang bisa menghapus data produk.') : 'Hanya role SHOP_OWNER yang bisa menghapus data produk.';
    res.status(403).json({
      success: false,
      message: msg,
    });
    return;
  }

  const { id } = req.params;
  const prodId = safeObjectId(id);
  if (!prodId) {
    const msg = (req as any).t ? (req as any).t('common.invalidInput', 'ID produk tidak valid') : 'ID produk tidak valid';
    res.status(400).json({ success: false, message: msg });
    return;
  }
  const productsCol = getCollection('products');

  const filter: Record<string, any> = { _id: prodId };
  if (req.user?.tenantId) {
    const tId = safeObjectId(req.user.tenantId);
    if (tId) filter.tenantId = tId;
  }

  const existing = await productsCol.findOne(filter);
  if (!existing) {
    const msg = (req as any).t ? (req as any).t('common.notFound', 'Produk tidak ditemukan di toko Anda') : 'Produk tidak ditemukan di toko Anda';
    res.status(404).json({ success: false, message: msg });
    return;
  }

  await productsCol.deleteOne(filter);

  await recordActivity(req, {
    action: 'DELETE',
    entity: 'PRODUK',
    entityId: existing._id,
    entityName: existing.name,
    details: `Menghapus produk "${existing.name}" (SKU: ${existing.sku || '-'}, Kategori: ${existing.category || '-'})`,
    previousData: existing,
  });

  const deletedMsg = (req as any).t ? (req as any).t('product.deleted', 'Produk berhasil dihapus') : 'Produk berhasil dihapus';
  res.json({ success: true, message: deletedMsg });
}
