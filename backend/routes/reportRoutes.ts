import { Router } from 'express';
import { getReportSummary } from '../controllers/reportController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';

const router = Router();
const apiLimiter = rateLimiter(90, 2);

router.get('/summary', apiLimiter, authenticateToken, getReportSummary);

export default router;
