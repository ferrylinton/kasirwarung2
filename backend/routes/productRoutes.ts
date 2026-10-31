import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { productSchema, updateStockSchema } from '../models/schemas.ts';
import { SHOP_OWNER } from '../constants/roles.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/', apiLimiter, optionalAuthenticateToken, getProducts);
router.post(
  '/',
  authenticateToken,
  requireRole(SHOP_OWNER),
  validateBody(productSchema),
  createProduct
);
router.put(
  '/:id',
  authenticateToken,
  requireRole(SHOP_OWNER),
  validateBody(updateStockSchema),
  updateProduct
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(SHOP_OWNER),
  deleteProduct
);

export default router;
