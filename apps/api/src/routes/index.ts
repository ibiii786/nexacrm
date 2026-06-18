import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import policiesRoutes from './policies.routes';
import groupsRoutes from './groups.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/policies', policiesRoutes);
router.use('/groups', groupsRoutes);

export default router;
