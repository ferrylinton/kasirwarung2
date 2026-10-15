import type { Response } from 'express';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getReportSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const productsCol = getCollection('products');

  const filter: Record<string, any> = {};

  if (req.user?.role !== 'ADMIN') {
    const tenantId =
      safeObjectId(req.user?.tenantId) ||
      (req.query.tenantId && req.query.tenantId !== 'ALL' ? safeObjectId(String(req.query.tenantId)) : null) ||
      new ObjectId('6ace8019cb267df584bd0001');
    filter.tenantId = tenantId;
  } else if (req.query.tenantId && req.query.tenantId !== 'ALL' && req.query.tenantId !== 'all') {
    const tId = safeObjectId(String(req.query.tenantId));
    if (tId) filter.tenantId = tId;
  }

  const paidOrders = await ordersCol.find({ ...filter, status: 'paid' }).toArray();
  const savedOrdersCount = await ordersCol.countDocuments({ ...filter, status: 'saved' });
  const totalProducts = await productsCol.countDocuments(filter);

  const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalTax = paidOrders.reduce((sum: number, o: any) => sum + (o.tax || 0), 0);
  const totalTransactions = paidOrders.length;

  const paymentBreakdown: Record<string, number> = { Tunai: 0, QRIS: 0, Transfer: 0 };
  paidOrders.forEach((o: any) => {
    const method = o.paymentMethod || 'Tunai';
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.total || 0);
  });

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalTax,
      totalTransactions,
      savedOrdersCount,
      totalProducts,
      paymentBreakdown,
      recentPaidCount: paidOrders.length,
    },
  });
}
