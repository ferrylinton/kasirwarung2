import type { Request, Response } from 'express';
import crypto from 'crypto';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import {
  sendTenantVerificationEmail,
  sendTenantReactivationEmail,
  recentEmailSimulations,
} from '../config/mailer.ts';

/**
 * GET /api/tenants
 * List all tenants (ADMIN only)
 */
export async function getTenants(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantsCol = getCollection('tenants');
  const usersCol = getCollection('users');
  const productsCol = getCollection('products');
  const ordersCol = getCollection('orders');

  const tenants = await tenantsCol.find({}).sort({ createdAt: -1 }).toArray();

  const data = await Promise.all(
    tenants.map(async (t: any) => {
      const tenantId = t._id;
      const cashierCount = await usersCol.countDocuments({
        tenantId,
        role: { $in: ['SHOP_CASHIER', 'kasir'] },
      });
      const productCount = await productsCol.countDocuments({ tenantId });
      const orderCount = await ordersCol.countDocuments({ tenantId });

      return {
        id: String(t._id),
        name: t.name,
        code: t.code,
        ownerEmail: t.ownerEmail,
        status: t.status || 'active',
        cashierCount,
        productCount,
        orderCount,
        deactivationRequest: t.deactivationRequest || null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    })
  );

  res.json({ success: true, data });
}

/**
 * GET /api/tenants/current
 * Get current tenant details for logged-in SHOP_OWNER or SHOP_CASHIER
 */
export async function getCurrentTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tId = safeObjectId(req.user?.tenantId);
  if (!tId) {
    res.status(400).json({ success: false, message: 'Tidak ada informasi tenan' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenant = await tenantsCol.findOne({ _id: tId });

  if (!tenant) {
    res.status(404).json({ success: false, message: 'Data tenan tidak ditemukan' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: String(tenant._id),
      name: tenant.name,
      code: tenant.code,
      ownerEmail: tenant.ownerEmail,
      status: tenant.status || 'active',
      deactivationRequest: tenant.deactivationRequest || null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    },
  });
}

/**
 * PUT /api/tenants/:id/status
 * Direct activate/deactivate tenant by ADMIN
 */
export async function updateTenantStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const tId = safeObjectId(id);
  if (!tId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak valid' });
    return;
  }
  const { status, reason } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    res.status(400).json({ success: false, message: 'Status tenan harus active atau inactive' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenant = await tenantsCol.findOne({ _id: tId });
  if (!tenant) {
    res.status(404).json({ success: false, message: 'Tenan tidak ditemukan' });
    return;
  }

  await tenantsCol.updateOne(
    { _id: tId },
    {
      $set: {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'active' ? { 'deactivationRequest.status': 'resolved' } : {}),
      },
    }
  );

  res.json({
    success: true,
    message: `Status tenan '${tenant.name}' berhasil diubah menjadi ${status === 'active' ? 'Aktif' : 'Nonaktif'}`,
  });
}

/**
 * POST /api/tenants/request-deactivation
 * SHOP_OWNER requests tenant account deactivation
 */
export async function requestDeactivation(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan' });
    return;
  }

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ success: false, message: 'Mohon cantumkan alasan penonaktifan minimal 5 karakter' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenantId = safeObjectId(req.user?.tenantId);
  if (!tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak valid' });
    return;
  }
  const tenant = await tenantsCol.findOne({ _id: tenantId });

  if (!tenant) {
    res.status(404).json({ success: false, message: 'Tenan tidak ditemukan' });
    return;
  }

  const deactivationRequest = {
    status: 'pending',
    reason: reason.trim(),
    requestedBy: req.user?.email || 'owner',
    requestedAt: new Date().toISOString(),
  };

  await tenantsCol.updateOne(
    { _id: tenantId },
    {
      $set: {
        deactivationRequest,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  res.json({
    success: true,
    message: 'Permintaan penonaktifan toko telah diajukan ke Admin. Anda dapat membatalkan permintaan ini selama belum disetujui.',
    data: deactivationRequest,
  });
}

/**
 * POST /api/tenants/cancel-deactivation
 * SHOP_OWNER cancels their pending deactivation request
 */
export async function cancelDeactivation(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak ditemukan' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenantId = safeObjectId(req.user?.tenantId);
  if (!tenantId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak valid' });
    return;
  }
  const tenant = await tenantsCol.findOne({ _id: tenantId });

  if (!tenant || !tenant.deactivationRequest || tenant.deactivationRequest.status !== 'pending') {
    res.status(400).json({ success: false, message: 'Tidak ada permintaan penonaktifan yang sedang menunggu verifikasi' });
    return;
  }

  await tenantsCol.updateOne(
    { _id: tenantId },
    {
      $set: {
        'deactivationRequest.status': 'cancelled',
        'deactivationRequest.cancelledAt': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  );

  res.json({
    success: true,
    message: 'Permintaan penonaktifan toko berhasil dibatalkan',
  });
}

/**
 * POST /api/tenants/:id/review-deactivation
 * ADMIN reviews deactivation request (approve or reject)
 */
export async function reviewDeactivation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { action, rejectReason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    res.status(400).json({ success: false, message: 'Aksi harus approve atau reject' });
    return;
  }

  const tId = safeObjectId(id);
  if (!tId) {
    res.status(400).json({ success: false, message: 'ID tenan tidak valid' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenant = await tenantsCol.findOne({ _id: tId });

  if (!tenant) {
    res.status(404).json({ success: false, message: 'Tenan tidak ditemukan' });
    return;
  }

  if (action === 'approve') {
    await tenantsCol.updateOne(
      { _id: tId },
      {
        $set: {
          status: 'inactive',
          'deactivationRequest.status': 'approved',
          'deactivationRequest.reviewedAt': new Date().toISOString(),
          'deactivationRequest.reviewedBy': req.user?.email || 'admin',
          updatedAt: new Date().toISOString(),
        },
      }
    );
    res.json({
      success: true,
      message: `Permintaan disetujui. Toko '${tenant.name}' telah dinonaktifkan. Seluruh user toko tidak dapat login.`,
    });
  } else {
    await tenantsCol.updateOne(
      { _id: tId },
      {
        $set: {
          'deactivationRequest.status': 'rejected',
          'deactivationRequest.rejectReason': rejectReason || 'Ditolak oleh Admin',
          'deactivationRequest.reviewedAt': new Date().toISOString(),
          'deactivationRequest.reviewedBy': req.user?.email || 'admin',
          updatedAt: new Date().toISOString(),
        },
      }
    );
    res.json({
      success: true,
      message: `Permintaan penonaktifan toko '${tenant.name}' telah ditolak. Toko tetap aktif.`,
    });
  }
}

/**
 * POST /api/tenants/request-reactivation
 * SHOP_OWNER requests reactivation by entering email
 */
export async function requestReactivation(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, message: 'Masukkan alamat email pemilik toko yang valid' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const usersCol = getCollection('users');

  // Find user and their tenant
  const user = await usersCol.findOne({ email: email.trim().toLowerCase() });
  if (!user || !user.tenantId) {
    res.status(404).json({ success: false, message: 'Email pemilik toko tidak ditemukan di sistem' });
    return;
  }

  const tId = safeObjectId(user.tenantId);
  const tenant = tId ? await tenantsCol.findOne({ _id: tId }) : null;
  if (!tenant) {
    res.status(404).json({ success: false, message: 'Data tenan tidak ditemukan' });
    return;
  }

  if (tenant.status === 'active') {
    res.status(400).json({ success: false, message: 'Akun toko ini sudah dalam kondisi aktif' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  await tenantsCol.updateOne(
    { _id: tenant._id },
    {
      $set: {
        reactivationToken: token,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const mailResult = await sendTenantReactivationEmail(user.email, tenant.name, token);

  res.json({
    success: true,
    message: `Tautan pengaktifan kembali telah dikirim ke email ${user.email}. Silakan klik tautan tersebut untuk mengaktifkan kembali akun toko Anda.`,
    data: {
      token,
      reactivationUrl: mailResult.reactivationUrl,
    },
  });
}

/**
 * POST /api/tenants/confirm-reactivation
 * Confirm reactivation using token from email link
 */
export async function confirmReactivation(req: Request, res: Response): Promise<void> {
  const token = req.body.token || req.query.token;

  if (!token) {
    res.status(400).json({ success: false, message: 'Token pengaktifan tidak ditemukan' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenant = await tenantsCol.findOne({ reactivationToken: String(token) });

  if (!tenant) {
    res.status(400).json({ success: false, message: 'Token pengaktifan tidak valid atau telah kedaluwarsa' });
    return;
  }

  await tenantsCol.updateOne(
    { _id: tenant._id },
    {
      $set: {
        status: 'active',
        reactivationToken: null,
        'deactivationRequest.status': 'reactivated',
        updatedAt: new Date().toISOString(),
      },
    }
  );

  res.json({
    success: true,
    message: `Toko '${tenant.name}' berhasil diaktifkan kembali! Seluruh staf dan pemilik toko kini dapat masuk kembali ke sistem.`,
    data: {
      shopName: tenant.name,
      ownerEmail: tenant.ownerEmail,
    },
  });
}

/**
 * GET or POST /api/tenants/verify
 * Confirm new tenant registration verification token
 */
export async function verifyTenant(req: Request, res: Response): Promise<void> {
  const token = req.body.token || req.query.token;

  if (!token) {
    res.status(400).json({ success: false, message: 'Token verifikasi tidak ditemukan' });
    return;
  }

  const tenantsCol = getCollection('tenants');
  const tenant = await tenantsCol.findOne({ verificationToken: String(token) });

  if (!tenant) {
    res.status(400).json({ success: false, message: 'Token verifikasi tidak valid atau telah kedaluwarsa' });
    return;
  }

  await tenantsCol.updateOne(
    { _id: tenant._id },
    {
      $set: {
        status: 'active',
        verificationToken: null,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  res.json({
    success: true,
    message: `Pendaftaran toko '${tenant.name}' berhasil dikonfirmasi! Toko Anda sekarang aktif dan dapat digunakan.`,
    data: {
      shopName: tenant.name,
      ownerEmail: tenant.ownerEmail,
    },
  });
}

/**
 * GET /api/tenants/recent-emails (simulation helper for preview UI)
 */
export async function getRecentEmails(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: recentEmailSimulations });
}
