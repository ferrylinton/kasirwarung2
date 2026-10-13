import { Request, Response } from 'express';
import { getCollection, ObjectId } from '../config/db.ts';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const { search, category } = req.query;
  const productsCol = getCollection('products');

  const filter: Record<string, any> = {};

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
    })),
  });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const productsCol = getCollection('products');
  const result = await productsCol.insertOne({
    ...req.body,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Produk berhasil ditambahkan',
    data: { id: String(result.insertedId), ...req.body },
  });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const productsCol = getCollection('products');

  await productsCol.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } }
  );

  const updated = await productsCol.findOne({ _id: new ObjectId(id) });
  res.json({
    success: true,
    message: 'Data produk diperbarui',
    data: updated,
  });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const productsCol = getCollection('products');
  await productsCol.deleteOne({ _id: new ObjectId(id) });
  res.json({ success: true, message: 'Produk berhasil dihapus' });
}
