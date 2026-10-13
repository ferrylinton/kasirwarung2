import { Request, Response } from 'express';
import { getCollection } from '../config/db.ts';

export async function getReportSummary(_req: Request, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const productsCol = getCollection('products');

  const paidOrders = await ordersCol.find({ status: 'paid' }).toArray();
  const savedOrdersCount = await ordersCol.countDocuments({ status: 'saved' });
  const totalProducts = await productsCol.countDocuments();

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
