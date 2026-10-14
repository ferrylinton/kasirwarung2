import type { Response } from 'express';
import { getCollection, ObjectId } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { search, category, tenantId: queryTenantId } = req.query;
  const productsCol = getCollection('products');

  const filter: Record<string, any> = {};

  // Multi-tenant scoping
  if (req.user?.role === 'ADMIN') {
    if (queryTenantId) {
      filter.tenantId = new ObjectId(String(queryTenantId));
    }
  } else if (req.user?.tenantId) {
    filter.tenantId = new ObjectId(req.user.tenantId);
  } else if (queryTenantId) {
    filter.tenantId = new ObjectId(String(queryTenantId));
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
  res.json({
    success: true,
    data: products.map((p: any) => ({
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
    })),
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

  res.status(201).json({
    success: true,
    message: 'Produk berhasil ditambahkan ke inventaris toko',
    data: { id: String(newProductId), ...req.body, tenantId: String(tenantId) },
  });
}

export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa mengubah data produk.',
    });
    return;
  }

  const { id } = req.params;
  const productsCol = getCollection('products');

  const filter: Record<string, any> = { _id: new ObjectId(id) };
  if (req.user?.tenantId) {
    filter.tenantId = new ObjectId(req.user.tenantId);
  }

  const existing = await productsCol.findOne(filter);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Produk tidak ditemukan di toko Anda' });
    return;
  }

  await productsCol.updateOne(filter, {
    $set: { ...req.body, updatedAt: new Date().toISOString() },
  });

  const updated = await productsCol.findOne(filter);
  res.json({
    success: true,
    message: 'Data produk berhasil diperbarui',
    data: updated,
  });
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa menghapus data produk.',
    });
    return;
  }

  const { id } = req.params;
  const productsCol = getCollection('products');

  const filter: Record<string, any> = { _id: new ObjectId(id) };
  if (req.user?.tenantId) {
    filter.tenantId = new ObjectId(req.user.tenantId);
  }

  const existing = await productsCol.findOne(filter);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Produk tidak ditemukan di toko Anda' });
    return;
  }

  await productsCol.deleteOne(filter);
  res.json({ success: true, message: 'Produk berhasil dihapus' });
}
