import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import policiesRoutes from './policies.routes';
import groupsRoutes from './groups.routes';
import ordersRoutes from './orders.routes';
import statusesRoutes from './statuses.routes';
import fieldsRoutes from './fields.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/policies', policiesRoutes);
router.use('/groups', groupsRoutes);
router.use('/orders', ordersRoutes);
router.use('/statuses', statusesRoutes);
router.use('/fields', fieldsRoutes);

export default router;
