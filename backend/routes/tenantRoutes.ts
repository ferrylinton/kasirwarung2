import { Router } from 'express';
import {
  getTenants,
  getCurrentTenant,
  updateTenantStatus,
  requestDeactivation,
  cancelDeactivation,
  reviewDeactivation,
  requestReactivation,
  confirmReactivation,
  verifyTenant,
  getRecentEmails,
  getDeactivationRequests,
  updateTenantSettings,
} from '../controllers/tenantController.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import {
  updateTenantStatusSchema,
  requestDeactivationSchema,
  reviewDeactivationSchema,
  requestReactivationSchema,
  updateTenantSettingsSchema,
} from '../models/schemas.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

// Public verification & reactivation endpoints
router.get('/verify', apiLimiter, verifyTenant);
router.post('/verify', apiLimiter, verifyTenant);
router.post('/request-reactivation', apiLimiter, validateBody(requestReactivationSchema), requestReactivation);
router.post('/confirm-reactivation', apiLimiter, confirmReactivation);
router.get('/recent-emails', apiLimiter, getRecentEmails);

// Tenant-scoped endpoints for current shop owner
router.get('/current', authenticateToken, getCurrentTenant);
router.put(
  '/settings',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik', 'ADMIN', 'MANAGER'),
  validateBody(updateTenantSettingsSchema),
  updateTenantSettings
);
router.post(
  '/request-deactivation',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  validateBody(requestDeactivationSchema),
  requestDeactivation
);
router.post(
  '/cancel-deactivation',
  authenticateToken,
  requireRole('SHOP_OWNER', 'pemilik'),
  cancelDeactivation
);

// Admin-only endpoints
router.get('/deactivation-requests', authenticateToken, requireRole('ADMIN'), getDeactivationRequests);
router.get('/', authenticateToken, requireRole('ADMIN'), getTenants);
router.put(
  '/:id/status',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(updateTenantStatusSchema),
  updateTenantStatus
);
router.post(
  '/:id/review-deactivation',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(reviewDeactivationSchema),
  reviewDeactivation
);

export default router;
