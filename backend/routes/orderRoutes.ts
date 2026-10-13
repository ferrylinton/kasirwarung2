import { Router } from 'express';
import {
  getSavedOrders,
  getOrderHistory,
  createOrSaveOrder,
  deleteSavedOrder,
  getNextInvoice,
} from '../controllers/orderController.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { createOrderSchema } from '../models/schemas.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/saved', apiLimiter, getSavedOrders);
router.get('/history', apiLimiter, getOrderHistory);
router.get('/next-invoice', apiLimiter, getNextInvoice);
router.post('/', authenticateToken, validateBody(createOrderSchema), createOrSaveOrder);
router.delete('/saved/:invoiceNo', authenticateToken, deleteSavedOrder);

export default router;
