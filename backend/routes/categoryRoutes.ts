import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { createCategorySchema, updateCategorySchema } from '../models/schemas.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/', apiLimiter, optionalAuthenticateToken, getCategories);
router.post(
  '/',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  validateBody(createCategorySchema),
  createCategory
);
router.put(
  '/:id',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  validateBody(updateCategorySchema),
  updateCategory
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  deleteCategory
);

export default router;
