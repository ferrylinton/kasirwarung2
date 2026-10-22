import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.ts';
import { getActivityLogs } from '../controllers/activityLogController.ts';

const router = Router();

router.get('/', authenticate, getActivityLogs);

export default router;
