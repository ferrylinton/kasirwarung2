import type { Response } from 'express';
import { getCollection, ObjectId } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId: queryTenantId } = req.query;
  const categoriesCol = getCollection('categories');
  const productsCol = getCollection('products');
  const tenantsCol = getCollection('tenants');

  const filter: Record<string, any> = {};

  if (req.user?.role === 'ADMIN') {
    if (queryTenantId) {
      filter.tenantId = new ObjectId(String(queryTenantId));
    }
  } else if (req.user?.tenantId) {
    filter.tenantId = new ObjectId(req.user.tenantId);
  } else if (queryTenantId) {
    filter.tenantId = new ObjectId(String(queryTenantId));
  } else {
    filter.tenantId = new ObjectId('6ace8019cb267df584bd0001');
  }

  // Get all tenants for name mapping and default category seeding
  const allTenants = await tenantsCol.find({}).toArray();
  const tenantMap = new Map(allTenants.map((t: any) => [String(t._id), t]));

  // Ensure default categories exist if tenant has none
  const tenantsToSeed = filter.tenantId ? [filter.tenantId] : allTenants.map((t: any) => t._id);
  for (const tid of tenantsToSeed) {
    const existingCount = await categoriesCol.countDocuments({ tenantId: tid });
    if (existingCount === 0) {
      const defaultCategories = [
        { name: 'Makanan Instan', icon: '🍜', color: '#F59E0B', description: 'Aneka mi instan, bubur, dan makanan cepat saji' },
        { name: 'Minuman', icon: '🥤', color: '#0EA5E9', description: 'Air mineral, susu kemasan, kopi, dan teh' },
        { name: 'Sembako', icon: '🌾', color: '#16A34A', description: 'Beras, minyak goreng, gula, telur, dan bumbu dapur' },
        { name: 'Camilan', icon: '🍿', color: '#D97706', description: 'Keripik, biskuit, wafer, dan snack ringan' },
        { name: 'Kebutuhan Rumah', icon: '🧼', color: '#8B5CF6', description: 'Sabun, deterjen, pasta gigi, dan peralatan sanitasi' },
      ];
      for (const c of defaultCategories) {
        await categoriesCol.insertOne({
          _id: new ObjectId(),
          tenantId: tid,
          name: c.name,
          icon: c.icon,
          color: c.color,
          description: c.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  const categories = await categoriesCol.find(filter).sort({ createdAt: 1 }).toArray();

  // Attach product count and tenant details for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (c: any) => {
      const productCount = await productsCol.countDocuments({
        tenantId: c.tenantId,
        category: c.name,
      });
      const t = c.tenantId ? tenantMap.get(String(c.tenantId)) : null;
      return {
        id: String(c._id),
        name: c.name,
        icon: c.icon || '📦',
        color: c.color || '#F59E0B',
        description: c.description || '',
        productCount,
        tenantId: String(c.tenantId),
        tenantName: t?.name || (c.tenantId ? 'Tenan ' + String(c.tenantId).slice(-4) : 'Warung Utama'),
        tenantCode: t?.code || '',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    })
  );

  res.json({
    success: true,
    data: categoriesWithCount,
  });
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Hanya role SHOP_OWNER yang bisa menambah data kategori
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa menambah kategori produk.',
    });
    return;
  }

  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan dalam sesi' });
    return;
  }

  const tenantId = new ObjectId(req.user.tenantId);
  const { name, description, icon, color } = req.body;
  const cleanName = name.trim();

  const categoriesCol = getCollection('categories');

  // Check duplicate category name in same tenant
  const existing = await categoriesCol.findOne({
    tenantId,
    name: { $regex: `^${cleanName}$`, $options: 'i' },
  });

  if (existing) {
    res.status(409).json({
      success: false,
      message: `Kategori dengan nama "${cleanName}" sudah ada di toko Anda.`,
    });
    return;
  }

  const newId = new ObjectId();
  const newCategory = {
    _id: newId,
    tenantId,
    name: cleanName,
    description: description?.trim() || '',
    icon: icon || '📦',
    color: color || '#F59E0B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await categoriesCol.insertOne(newCategory);

  res.status(201).json({
    success: true,
    message: 'Kategori baru berhasil ditambahkan',
    data: {
      id: String(newId),
      ...newCategory,
      tenantId: String(tenantId),
      productCount: 0,
    },
  });
}

export async function updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Hanya role SHOP_OWNER yang bisa mengubah data kategori
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa mengubah data kategori produk.',
    });
    return;
  }

  const { id } = req.params;
  const tenantId = new ObjectId(req.user!.tenantId);
  const categoriesCol = getCollection('categories');
  const productsCol = getCollection('products');

  const existing = await categoriesCol.findOne({
    _id: new ObjectId(id),
    tenantId,
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      message: 'Kategori tidak ditemukan di toko Anda',
    });
    return;
  }

  const { name, description, icon, color } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

  if (description !== undefined) updates.description = description.trim();
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;

  if (name && name.trim() !== existing.name) {
    const cleanName = name.trim();
    // Check if new name conflicts with another category
    const duplicate = await categoriesCol.findOne({
      _id: { $ne: new ObjectId(id) },
      tenantId,
      name: { $regex: `^${cleanName}$`, $options: 'i' },
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: `Kategori "${cleanName}" sudah ada di toko Anda.`,
      });
      return;
    }

    updates.name = cleanName;

    // Synchronize all products that used old category name
    await productsCol.updateMany(
      { tenantId, category: existing.name },
      { $set: { category: cleanName, updatedAt: new Date().toISOString() } }
    );
  }

  await categoriesCol.updateOne({ _id: new ObjectId(id), tenantId }, { $set: updates });

  const updated = await categoriesCol.findOne({ _id: new ObjectId(id), tenantId });
  const productCount = await productsCol.countDocuments({
    tenantId,
    category: updated.name,
  });

  res.json({
    success: true,
    message: 'Kategori berhasil diperbarui',
    data: {
      id: String(updated._id),
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      color: updated.color,
      productCount,
      tenantId: String(updated.tenantId),
      updatedAt: updated.updatedAt,
    },
  });
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Hanya role SHOP_OWNER yang bisa menghapus data kategori
  if (req.user?.role !== 'SHOP_OWNER' && req.user?.role !== 'pemilik') {
    res.status(403).json({
      success: false,
      message: 'Hanya role SHOP_OWNER yang bisa menghapus kategori produk.',
    });
    return;
  }

  const { id } = req.params;
  const tenantId = new ObjectId(req.user!.tenantId);
  const categoriesCol = getCollection('categories');
  const productsCol = getCollection('products');

  const existing = await categoriesCol.findOne({
    _id: new ObjectId(id),
    tenantId,
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      message: 'Kategori tidak ditemukan di toko Anda',
    });
    return;
  }

  // Count if products are assigned to this category
  const linkedProductsCount = await productsCol.countDocuments({
    tenantId,
    category: existing.name,
  });

  if (linkedProductsCount > 0) {
    // Reassign products to 'Lainnya' so they don't break
    await productsCol.updateMany(
      { tenantId, category: existing.name },
      { $set: { category: 'Lainnya', updatedAt: new Date().toISOString() } }
    );
  }

  await categoriesCol.deleteOne({ _id: new ObjectId(id), tenantId });

  res.json({
    success: true,
    message: linkedProductsCount > 0
      ? `Kategori "${existing.name}" dihapus. Sebanyak ${linkedProductsCount} produk dialihkan ke kategori "Lainnya".`
      : `Kategori "${existing.name}" berhasil dihapus.`,
  });
}
