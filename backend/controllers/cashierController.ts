import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { recordActivity } from '../services/activityLogService.ts';

/**
 * GET /api/cashiers
 * List all cashiers for the current tenant (SHOP_OWNER or ADMIN)
 */
export async function getCashiers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const usersCol = getCollection('users');
  const tenantId = req.user?.tenantId ? safeObjectId(req.user.tenantId) : null;

  const filter: Record<string, any> = {
    role: { $in: ['SHOP_CASHIER', 'kasir'] },
  };

  // If not super admin, scope to current tenant
  if (req.user?.role !== 'ADMIN' && tenantId) {
    filter.tenantId = tenantId;
  }

  const cashiers = await usersCol.find(filter).sort({ createdAt: -1 }).toArray();

  res.json({
    success: true,
    data: cashiers.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      username: c.username || c.email.split('@')[0],
      email: c.email,
      role: 'SHOP_CASHIER',
      shift: c.shift || 'Shift Pagi (08:00 - 16:00)',
      status: c.status || 'active',
      createdAt: c.createdAt,
    })),
  });
}

/**
 * POST /api/cashiers
 * Create a new cashier under the current tenant (SHOP_OWNER only)
 */
export async function createCashier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, username, email, password, shift } = req.body;

  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan dalam sesi' });
    return;
  }

  const usersCol = getCollection('users');

  // Check email or username uniqueness
  const existing = await usersCol.findOne({
    $or: [{ email: email.trim().toLowerCase() }, { username: username.trim().toLowerCase() }],
  });

  if (existing) {
    res.status(409).json({
      success: false,
      message: 'Email atau username kasir sudah terdaftar. Gunakan yang lain.',
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const tenantId = safeObjectId(req.user.tenantId) || new ObjectId('6ace8019cb267df584bd0001');
  const newCashierId = new ObjectId();

  await usersCol.insertOne({
    _id: newCashierId,
    tenantId,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'SHOP_CASHIER',
    shift: shift || 'Shift Pagi (08:00 - 16:00)',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await recordActivity(req, {
    action: 'CREATE',
    entity: 'PENGGUNA',
    entityId: newCashierId,
    entityName: name.trim(),
    details: `Menambahkan kasir/pengguna baru "${name.trim()}" (@${username.trim().toLowerCase()}, ${shift || 'Shift Pagi (08:00 - 16:00)'})`,
    newData: {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      role: 'SHOP_CASHIER',
      shift: shift || 'Shift Pagi (08:00 - 16:00)',
      status: 'active',
    },
  });

  res.status(201).json({
    success: true,
    message: `Kasir '${name}' berhasil ditambahkan ke toko Anda`,
    data: {
      id: String(newCashierId),
      name,
      username,
      email,
      role: 'SHOP_CASHIER',
      shift,
    },
  });
}

/**
 * PUT /api/cashiers/:id
 * Update cashier details (SHOP_OWNER only)
 */
export async function updateCashier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const cashierId = safeObjectId(id);
  if (!cashierId) {
    res.status(400).json({ success: false, message: 'ID kasir tidak valid' });
    return;
  }
  const { name, shift, password, status } = req.body;

  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan' });
    return;
  }

  const usersCol = getCollection('users');
  const tenantId = safeObjectId(req.user.tenantId) || new ObjectId('6ace8019cb267df584bd0001');

  const filter: Record<string, any> = {
    _id: cashierId,
    role: { $in: ['SHOP_CASHIER', 'kasir'] },
  };

  if (req.user?.role !== 'ADMIN') {
    filter.tenantId = tenantId;
  }

  const cashier = await usersCol.findOne(filter);
  if (!cashier) {
    res.status(404).json({ success: false, message: 'Data kasir tidak ditemukan di toko Anda' });
    return;
  }

  const updateFields: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (name) updateFields.name = name.trim();
  if (shift) updateFields.shift = shift;
  if (status) updateFields.status = status;
  if (password && password.trim().length >= 6) {
    updateFields.passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  await usersCol.updateOne(filter, { $set: updateFields });

  const updatedCashier = await usersCol.findOne(filter);

  await recordActivity(req, {
    action: 'UPDATE',
    entity: 'PENGGUNA',
    entityId: cashierId,
    entityName: cashier.name,
    details: `Memperbarui data pengguna/kasir "${cashier.name}"` + (name && name.trim() !== cashier.name ? ` (nama diubah menjadi "${name.trim()}")` : '') + (status && status !== cashier.status ? ` (status diubah menjadi ${status})` : ''),
    previousData: {
      name: cashier.name,
      shift: cashier.shift,
      status: cashier.status,
    },
    newData: {
      name: updatedCashier?.name,
      shift: updatedCashier?.shift,
      status: updatedCashier?.status,
    },
  });

  res.json({
    success: true,
    message: 'Data kasir berhasil diperbarui',
  });
}

/**
 * DELETE /api/cashiers/:id
 * Delete cashier from tenant (SHOP_OWNER only)
 */
export async function deleteCashier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const cashierId = safeObjectId(id);
  if (!cashierId) {
    res.status(400).json({ success: false, message: 'ID kasir tidak valid' });
    return;
  }

  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan' });
    return;
  }

  const usersCol = getCollection('users');
  const tenantId = safeObjectId(req.user.tenantId) || new ObjectId('6ace8019cb267df584bd0001');

  const filter: Record<string, any> = {
    _id: cashierId,
    role: { $in: ['SHOP_CASHIER', 'kasir'] },
  };

  if (req.user?.role !== 'ADMIN') {
    filter.tenantId = tenantId;
  }

  const cashier = await usersCol.findOne(filter);
  if (!cashier) {
    res.status(404).json({ success: false, message: 'Data kasir tidak ditemukan' });
    return;
  }

  await usersCol.deleteOne(filter);

  await recordActivity(req, {
    action: 'DELETE',
    entity: 'PENGGUNA',
    entityId: cashierId,
    entityName: cashier.name,
    details: `Menghapus akun pengguna/kasir "${cashier.name}" (@${cashier.username || cashier.email})`,
    previousData: {
      name: cashier.name,
      username: cashier.username,
      email: cashier.email,
      shift: cashier.shift,
      status: cashier.status,
    },
  });

  res.json({
    success: true,
    message: `Kasir '${cashier.name}' berhasil dihapus dari toko`,
  });
}
