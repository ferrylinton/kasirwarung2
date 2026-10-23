import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { getActivityLogs } from '../controllers/activityLogController.ts';

const router = Router();

router.get('/', authenticateToken, getActivityLogs);

export default router;
