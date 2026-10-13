import { Router } from 'express';
import {
  login,
  register,
  refresh,
  logout,
  getMe,
  switchCashier,
  changePassword,
  getLoginHistory,
} from '../controllers/authController.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { loginSchema, registerSchema, refreshSchema } from '../models/schemas.ts';

const router = Router();

// Token bucket rate limit for auth endpoints (15 req / min)
const authLimiter = rateLimiter(15, 0.5);

router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/refresh', validateBody(refreshSchema), refresh);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.post('/switch-cashier', switchCashier);
router.post('/change-password', authenticateToken, changePassword);
router.get('/login-history', authenticateToken, getLoginHistory);

export default router;
