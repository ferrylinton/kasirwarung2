import { Request, Response } from 'express';
import { getCollection, ObjectId } from '../config/db.ts';
import { sendReceiptEmail } from '../config/mailer.ts';
import { formatCurrentTimeHHMM } from '../utils/invoice.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getSavedOrders(_req: Request, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const savedOrders = await ordersCol
    .find({ status: 'saved' })
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
    })),
  });
}

export async function getOrderHistory(_req: Request, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const list = await ordersCol
    .find({ status: { $in: ['paid', 'cancelled'] } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  res.json({
    success: true,
    data: list.map((o: any) => ({
      id: String(o._id),
      invoiceNo: o.invoiceNo,
      status: o.status,
      timeLabel: o.timeLabel || formatCurrentTimeHHMM(),
      customerName: o.customerName || 'Umum',
      cashierName: o.cashierName || 'Budi Santoso',
      paymentMethod: o.paymentMethod || 'Tunai',
      items: o.items || [],
      subtotal: o.subtotal,
      tax: o.tax,
      total: o.total,
      cashReceived: o.cashReceived,
      changeAmount: o.changeAmount,
      createdAt: o.createdAt,
    })),
  });
}

export async function createOrSaveOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  const ordersCol = getCollection('orders');
  const productsCol = getCollection('products');

  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const summaryItems = items.map((i: any) => i.name.split(' ')[0]).slice(0, 3).join(', ');
  const summaryLabel = `${items.length} Item: ${summaryItems}...`;
  const timeLabel = formatCurrentTimeHHMM();

  // If status is 'paid', deduct inventory stock
  if (status === 'paid') {
    for (const item of items) {
      if (item.productId) {
        try {
          await productsCol.updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { stock: -item.qty } }
          );
        } catch {
          // If productId is not ObjectId string, fallback by sku or name
          await productsCol.updateOne(
            { name: item.name },
            { $inc: { stock: -item.qty } }
          );
        }
      }
    }
  }

  // If this was an existing saved order being completed or updated, update or replace it
  const existingOrder = await ordersCol.findOne({ invoiceNo });
  let orderId: string;

  const orderPayload = {
    invoiceNo,
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
    await ordersCol.updateOne({ invoiceNo }, { $set: orderPayload });
    orderId = String(existingOrder._id);
  } else {
    const insertResult = await ordersCol.insertOne({
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
    message: status === 'saved' ? 'Pesanan berhasil disimpan (Belum Dibayar)' : 'Pembayaran berhasil diproses',
    data: {
      id: orderId,
      ...orderPayload,
      emailStatus,
    },
  });
}

export async function deleteSavedOrder(req: Request, res: Response): Promise<void> {
  const { invoiceNo } = req.params;
  const ordersCol = getCollection('orders');
  await ordersCol.deleteOne({ invoiceNo });
  res.json({ success: true, message: `Pesanan ${invoiceNo} berhasil dihapus` });
}

export async function getNextInvoice(_req: Request, res: Response): Promise<void> {
  const ordersCol = getCollection('orders');
  const count = await ordersCol.countDocuments();
  const nextSeq = count + 42; // Starts from 42 as in screenshot INV/2025/05/28-0042
  const nextInvoiceNo = `INV/2025/05/28-${String(nextSeq).padStart(4, '0')}`;
  res.json({ success: true, invoiceNo: nextInvoiceNo });
}
