import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { redisCache } from '../middleware/redisCache';

const router = Router();

router.use(authenticate);

router.get('/admin', redisCache(300), DashboardController.getAdminStats);
router.get('/user', redisCache(300), DashboardController.getUserStats);

export default router;
