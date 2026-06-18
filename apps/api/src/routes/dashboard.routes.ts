import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/admin', DashboardController.getAdminStats);
router.get('/user', DashboardController.getUserStats);

export default router;
