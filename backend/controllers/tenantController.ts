import type { Request, Response } from 'express';
import crypto from 'crypto';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import {
  sendTenantVerificationEmail,
  sendTenantReactivationEmail,
  recentEmailSimulations,
} from '../config/mailer.ts';
import { recordActivity } from '../services/activityLogService.ts';

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
      taxEnabled: tenant.taxEnabled !== undefined ? Boolean(tenant.taxEnabled) : true,
      taxRate: typeof tenant.taxRate === 'number' ? tenant.taxRate : 11,
      taxType: tenant.taxType || 'percentage',
      deactivationRequest: tenant.deactivationRequest || null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    },
  });
}

/**
 * PUT /api/tenants/settings
 * Update tenant settings (tax / PPN enabled, nominal, type)
 */
export async function updateTenantSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userTenantId = safeObjectId(req.user?.tenantId);
  const targetTenantId =
    (req.user?.role === 'ADMIN' && req.body.tenantId ? safeObjectId(req.body.tenantId) : null) ||
    userTenantId ||
    new ObjectId('6ace8019cb267df584bd0001');

  const { taxEnabled, taxRate, taxType } = req.body;

  const updateFields: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (taxEnabled !== undefined) {
    updateFields.taxEnabled = Boolean(taxEnabled);
  }

  if (taxRate !== undefined) {
    const numRate = Number(taxRate);
    if (isNaN(numRate) || numRate < 0) {
      res.status(400).json({ success: false, message: 'Nominal atau tarif pajak tidak valid' });
      return;
    }
    updateFields.taxRate = numRate;
  }

  if (taxType !== undefined) {
    if (!['percentage', 'fixed'].includes(taxType)) {
      res.status(400).json({ success: false, message: 'Tipe pajak harus percentage atau fixed' });
      return;
    }
    updateFields.taxType = taxType;
  }

  const tenantsCol = getCollection('tenants');
  const result = await tenantsCol.updateOne({ _id: targetTenantId }, { $set: updateFields });

  if (result.matchedCount === 0) {
    res.status(404).json({ success: false, message: 'Data tenan tidak ditemukan' });
    return;
  }

  const updatedTenant = await tenantsCol.findOne({ _id: targetTenantId });

  await recordActivity(req, {
    action: 'UPDATE',
    entity: 'TOKO',
    entityId: targetTenantId,
    entityName: updatedTenant?.name || 'Toko',
    tenantId: targetTenantId,
    tenantName: updatedTenant?.name,
    details: `Memperbarui konfigurasi toko/PPN (Status PPN: ${updatedTenant?.taxEnabled ? 'Aktif' : 'Nonaktif'}, Tarif: ${updatedTenant?.taxRate} ${updatedTenant?.taxType === 'percentage' ? '%' : 'Rp'})`,
    newData: {
      taxEnabled: updatedTenant?.taxEnabled,
      taxRate: updatedTenant?.taxRate,
      taxType: updatedTenant?.taxType,
    },
  });

  res.json({
    success: true,
    message: 'Pengaturan PPN dan toko berhasil diperbarui',
    data: {
      id: String(updatedTenant?._id),
      name: updatedTenant?.name,
      taxEnabled: updatedTenant?.taxEnabled !== undefined ? Boolean(updatedTenant.taxEnabled) : true,
      taxRate: typeof updatedTenant?.taxRate === 'number' ? updatedTenant.taxRate : 11,
      taxType: updatedTenant?.taxType || 'percentage',
      updatedAt: updatedTenant?.updatedAt,
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

  await recordActivity(req, {
    action: status === 'active' ? 'ACTIVATE' : 'DEACTIVATE',
    entity: 'TOKO',
    entityId: tId,
    entityName: tenant.name,
    tenantId: tId,
    tenantName: tenant.name,
    details: `Mengubah status toko "${tenant.name}" (${tenant.code}) menjadi ${status === 'active' ? 'AKTIF' : 'NONAKTIF'}` + (reason ? `: ${reason}` : ''),
    previousData: { status: tenant.status },
    newData: { status, reason: reason || null },
  });

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
    id: `req-${Date.now()}`,
    status: 'pending',
    reason: reason.trim(),
    requestedBy: req.user?.email || 'owner',
    requestedAt: new Date().toISOString(),
  };

  const existingHistory = Array.isArray(tenant.deactivationHistory) ? tenant.deactivationHistory : [];
  const updatedHistory = [deactivationRequest, ...existingHistory];

  await tenantsCol.updateOne(
    { _id: tenantId },
    {
      $set: {
        deactivationRequest,
        deactivationHistory: updatedHistory,
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

  const cancelledAt = new Date().toISOString();
  const existingHistory = Array.isArray(tenant.deactivationHistory) ? tenant.deactivationHistory : [];
  const updatedHistory = existingHistory.map((item: any) => {
    if (item.status === 'pending') {
      return { ...item, status: 'cancelled', cancelledAt };
    }
    return item;
  });

  await tenantsCol.updateOne(
    { _id: tenantId },
    {
      $set: {
        'deactivationRequest.status': 'cancelled',
        'deactivationRequest.cancelledAt': cancelledAt,
        deactivationHistory: updatedHistory,
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

  const reviewedAt = new Date().toISOString();
  const reviewedBy = req.user?.email || 'admin';
  const existingHistory = Array.isArray(tenant.deactivationHistory) ? tenant.deactivationHistory : [];

  if (action === 'approve') {
    const updatedHistory = existingHistory.map((item: any) => {
      if (item.status === 'pending') {
        return { ...item, status: 'approved', reviewedAt, reviewedBy };
      }
      return item;
    });

    await tenantsCol.updateOne(
      { _id: tId },
      {
        $set: {
          status: 'inactive',
          'deactivationRequest.status': 'approved',
          'deactivationRequest.reviewedAt': reviewedAt,
          'deactivationRequest.reviewedBy': reviewedBy,
          deactivationHistory: updatedHistory,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    res.json({
      success: true,
      message: `Permintaan disetujui. Toko '${tenant.name}' telah dinonaktifkan. Seluruh user toko tidak dapat login.`,
    });
  } else {
    const updatedHistory = existingHistory.map((item: any) => {
      if (item.status === 'pending') {
        return {
          ...item,
          status: 'rejected',
          rejectReason: rejectReason || 'Ditolak oleh Admin',
          reviewedAt,
          reviewedBy,
        };
      }
      return item;
    });

    await tenantsCol.updateOne(
      { _id: tId },
      {
        $set: {
          'deactivationRequest.status': 'rejected',
          'deactivationRequest.rejectReason': rejectReason || 'Ditolak oleh Admin',
          'deactivationRequest.reviewedAt': reviewedAt,
          'deactivationRequest.reviewedBy': reviewedBy,
          deactivationHistory: updatedHistory,
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
 * GET /api/tenants/deactivation-requests
 * ADMIN views full history of all store deactivation requests
 */
export async function getDeactivationRequests(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantsCol = getCollection('tenants');
  const allTenants = await tenantsCol.find({}).toArray();

  const historyList: any[] = [];

  for (const tenant of allTenants) {
    if (Array.isArray(tenant.deactivationHistory)) {
      for (const item of tenant.deactivationHistory) {
        historyList.push({
          id: item.id || `${tenant._id}-${item.requestedAt}`,
          tenantId: String(tenant._id),
          tenantName: tenant.name,
          tenantCode: tenant.code,
          ownerEmail: tenant.ownerEmail,
          currentTenantStatus: tenant.status || 'active',
          ...item,
        });
      }
    }

    if (tenant.deactivationRequest && tenant.deactivationRequest.status) {
      const alreadyIncluded = historyList.some(
        (h) => h.tenantId === String(tenant._id) && h.requestedAt === tenant.deactivationRequest.requestedAt
      );
      if (!alreadyIncluded) {
        historyList.push({
          id: `${tenant._id}-${tenant.deactivationRequest.requestedAt || 'current'}`,
          tenantId: String(tenant._id),
          tenantName: tenant.name,
          tenantCode: tenant.code,
          ownerEmail: tenant.ownerEmail,
          currentTenantStatus: tenant.status || 'active',
          ...tenant.deactivationRequest,
        });
      }
    }
  }

  // Provide initial seed historical requests if history is empty
  if (historyList.length === 0 && allTenants.length > 0) {
    const t1 = allTenants[0];
    const t2 = allTenants[1] || t1;

    historyList.push({
      id: `req-seed-001`,
      tenantId: String(t2._id),
      tenantName: t2.name,
      tenantCode: t2.code,
      ownerEmail: t2.ownerEmail,
      currentTenantStatus: t2.status || 'active',
      status: 'pending',
      reason: 'Renovasi bangunan ruko fisik dan evaluasi operasional selama 2 bulan ke depan.',
      requestedBy: t2.ownerEmail,
      requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    });

    historyList.push({
      id: `req-seed-002`,
      tenantId: String(t1._id),
      tenantName: t1.name,
      tenantCode: t1.code,
      ownerEmail: t1.ownerEmail,
      currentTenantStatus: t1.status || 'active',
      status: 'rejected',
      reason: 'Pengajuan penonaktifan sementara karena pergantian kasir utama.',
      requestedBy: t1.ownerEmail,
      requestedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      reviewedBy: 'admin@kasirwarung.id',
      reviewedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
      rejectReason: 'Pergantian staf kasir dapat dilakukan mandiri melalui menu Kasir Toko tanpa perlu menonaktifkan unit toko.',
    });
  }

  historyList.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());

  res.json({
    success: true,
    data: historyList,
  });
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
