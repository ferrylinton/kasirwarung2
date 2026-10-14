import { Router } from 'express';
import {
  getCashiers,
  createCashier,
  updateCashier,
  deleteCashier,
} from '../controllers/cashierController.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { createCashierSchema, updateCashierSchema } from '../models/schemas.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/', apiLimiter, authenticateToken, requireRole('SHOP_OWNER', 'ADMIN', 'pemilik'), getCashiers);
router.post(
  '/',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  validateBody(createCashierSchema),
  createCashier
);
router.put(
  '/:id',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  validateBody(updateCashierSchema),
  updateCashier
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  deleteCashier
);

export default router;
