import type { Response } from 'express';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import { sendReceiptEmail } from '../config/mailer.ts';
import { formatCurrentTimeHHMM } from '../utils/invoice.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { cleanupOrdersOlderThanThreeMonths } from '../services/cleanupScheduler.ts';

export async function getSavedOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const tenantId =
    safeObjectId(req.user?.tenantId) ||
    (req.query.tenantId && req.query.tenantId !== 'ALL' ? safeObjectId(String(req.query.tenantId)) : null) ||
    new ObjectId('6ace8019cb267df584bd0001');

  const filter: Record<string, any> = { status: 'saved' };
  if (req.user?.role !== 'ADMIN' || (req.query.tenantId && req.query.tenantId !== 'ALL')) {
    filter.tenantId = tenantId;
  }

  const savedOrders = await ordersCol
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  res.json({
    success: true,
    data: savedOrders.map((o: any) => ({
      id: String(o._id),
      invoiceNo: o.invoiceNo,
      status: o.status,
      timeLabel: o.timeLabel || formatCurrentTimeHHMM(),
      summaryLabel: o.summaryLabel || `${o.items?.length || 0} Item: ${o.items?.map((i: any) => i.name).slice(0, 3).join(', ')}...`,
      customerName: o.customerName || 'Pelanggan Umum',
      cashierName: o.cashierName || 'Budi Santoso',
      items: o.items || [],
      subtotal: o.subtotal || 0,
      tax: o.tax || 0,
      total: o.total || 0,
      createdAt: o.createdAt,
      tenantId: String(o.tenantId),
    })),
  });
}

export async function getOrderHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId: queryTenantId, startDate, endDate } = req.query;
  const ordersCol = getCollection('orders');
  const tenantsCol = getCollection('tenants');

  // 3-Month retention baseline cutoff
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const baselineCutoffIso = threeMonthsAgo.toISOString();

  const filter: Record<string, any> = {
    status: { $in: ['paid', 'cancelled'] },
  };

  // Date filtering with 3-month max retention boundary
  const dateFilter: Record<string, string> = { $gte: baselineCutoffIso };
  if (startDate) {
    const sDate = new Date(String(startDate));
    if (!isNaN(sDate.getTime())) {
      sDate.setHours(0, 0, 0, 0);
      const sIso = sDate.toISOString();
      // Cannot view older than 3 months
      dateFilter.$gte = sIso > baselineCutoffIso ? sIso : baselineCutoffIso;
    }
  }
  if (endDate) {
    const eDate = new Date(String(endDate));
    if (!isNaN(eDate.getTime())) {
      eDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = eDate.toISOString();
    }
  }
  filter.createdAt = dateFilter;

  // Tenant scoping: SHOP_OWNER can only see their own tenant; ADMIN can see ALL or specific tenant
  if (req.user?.role !== 'ADMIN') {
    const userTenantId = safeObjectId(req.user?.tenantId) || new ObjectId('6ace8019cb267df584bd0001');
    if (String(userTenantId) === '6ace8019cb267df584bd0001') {
      filter.$or = [{ tenantId: userTenantId }, { tenantId: { $exists: false } }, { tenantId: null }];
    } else {
      filter.tenantId = userTenantId;
    }
  } else if (queryTenantId && queryTenantId !== 'ALL' && queryTenantId !== 'all') {
    const tId = safeObjectId(String(queryTenantId));
    if (tId) filter.tenantId = tId;
  }

  const list = await ordersCol
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  // Map tenant names for display
  const allTenants = await tenantsCol.find({}).toArray();
  const tenantMap = new Map(allTenants.map((t: any) => [String(t._id), t.name]));

  res.json({
    success: true,
    retentionPolicy: '3_MONTHS',
    earliestAllowedDate: baselineCutoffIso,
    data: list.map((o: any) => ({
      id: String(o._id),
      invoiceNo: o.invoiceNo,
      status: o.status,
      timeLabel: o.timeLabel || formatCurrentTimeHHMM(),
      customerName: o.customerName || 'Umum',
      cashierName: o.cashierName || 'Budi Santoso',
      items: o.items || [],
      subtotal: o.subtotal,
      tax: o.tax,
      total: o.total,
      cashReceived: o.cashReceived,
      changeAmount: o.changeAmount,
      createdAt: o.createdAt,
      tenantId: String(o.tenantId),
      tenantName: tenantMap.get(String(o.tenantId)) || 'Warung Berkah Budi',
    })),
  });
}

export async function triggerCleanupOrders(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const result = await cleanupOrdersOlderThanThreeMonths();
  res.json({
    success: true,
    message: `Pembersihan riwayat transaksi lama selesai. Sebanyak ${result.deletedCount} transaksi lebih dari 3 bulan telah dihapus.`,
    data: result,
  });
}

export async function createOrSaveOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Role ADMIN tidak bisa bikin order
  if (req.user?.role === 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Role ADMIN tidak bisa bikin order. Hanya kasir atau pemilik toko (SHOP_CASHIER / SHOP_OWNER) yang dapat membuat transaksi.',
    });
    return;
  }

  const {
    invoiceNo,
    status,
    items,
    customerName,
    customerEmail,
    paymentMethod,
    cashReceived,
    notes,
  } = req.body;

  const tenantId =
    safeObjectId(req.user?.tenantId) ||
    new ObjectId('6ace8019cb267df584bd0001');

  const ordersCol = getCollection('orders');
  const productsCol = getCollection('products');

  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const summaryItems = items.map((i: any) => i.name.split(' ')[0]).slice(0, 3).join(', ');
  const summaryLabel = `${items.length} Item: ${summaryItems}...`;
  const timeLabel = formatCurrentTimeHHMM();

  // If status is 'paid', deduct inventory stock for this tenant
  if (status === 'paid') {
    for (const item of items) {
      const pId = safeObjectId(item.productId);
      if (pId) {
        try {
          await productsCol.updateOne(
            { _id: pId, tenantId },
            { $inc: { stock: -item.qty } }
          );
        } catch {
          await productsCol.updateOne(
            { name: item.name, tenantId },
            { $inc: { stock: -item.qty } }
          );
        }
      } else {
        await productsCol.updateOne(
          { name: item.name, tenantId },
          { $inc: { stock: -item.qty } }
        );
      }
    }
  }

  // If this was an existing saved order being completed or updated, update or replace it
  const existingOrder = await ordersCol.findOne({ invoiceNo, tenantId });
  let orderId: string;

  const orderPayload = {
    invoiceNo,
    tenantId,
    status,
    timeLabel,
    summaryLabel,
    customerName: customerName || 'Pelanggan Umum',
    customerEmail: customerEmail || '',
    cashierName: req.user?.name || 'Budi Santoso',
    paymentMethod: paymentMethod || (status === 'saved' ? 'Belum Dibayar' : 'Tunai'),
    items,
    subtotal,
    tax,
    total,
    cashReceived: cashReceived || total,
    changeAmount: Math.max(0, (cashReceived || total) - total),
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  };

  if (existingOrder) {
    await ordersCol.updateOne({ invoiceNo, tenantId }, { $set: orderPayload });
    orderId = String(existingOrder._id);
  } else {
    const insertResult = await ordersCol.insertOne({
      _id: new ObjectId(),
      ...orderPayload,
      createdAt: new Date().toISOString(),
    });
    orderId = String(insertResult.insertedId);
  }

  // If email was provided and status is paid, trigger SMTP receipt email
  let emailStatus: { sent: boolean; message: string } | null = null;
  if (status === 'paid' && customerEmail && customerEmail.includes('@')) {
    emailStatus = await sendReceiptEmail(customerEmail, invoiceNo, total, items);
  }

  res.status(201).json({
    success: true,
    message: status === 'saved' ? 'Pesanan berhasil disimpan ke Pesanan Sementara' : 'Pembayaran berhasil diproses',
    data: {
      id: orderId,
      ...orderPayload,
      emailStatus,
    },
  });
}

export async function deleteSavedOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { invoiceNo } = req.params;
  const tenantId =
    safeObjectId(req.user?.tenantId) ||
    new ObjectId('6ace8019cb267df584bd0001');

  const ordersCol = getCollection('orders');
  await ordersCol.deleteOne({ invoiceNo, tenantId });
  res.json({ success: true, message: `Pesanan ${invoiceNo} berhasil dihapus` });
}

export async function getNextInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const tenantId =
    safeObjectId(req.user?.tenantId) ||
    new ObjectId('6ace8019cb267df584bd0001');

  const count = await ordersCol.countDocuments({ tenantId });
  const nextSeq = count + 42;
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const nextInvoiceNo = `INV/${dateStr}-${String(nextSeq).padStart(4, '0')}`;
  res.json({ success: true, invoiceNo: nextInvoiceNo });
}
