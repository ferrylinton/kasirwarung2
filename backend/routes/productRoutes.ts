import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { productSchema, updateStockSchema } from '../models/schemas.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/', apiLimiter, getProducts);
router.post('/', authenticateToken, requireRole('admin', 'pemilik'), validateBody(productSchema), createProduct);
router.put('/:id', authenticateToken, validateBody(updateStockSchema), updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin', 'pemilik'), deleteProduct);

export default router;
