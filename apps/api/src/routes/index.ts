import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import permissionsRoutes from './permissions.routes';
import ordersRoutes from './orders.routes';
import statusesRoutes from './statuses.routes';
import fieldsRoutes from './fields.routes';
import notificationsRoutes from './notifications.routes';
import announcementsRoutes from './announcements.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';
import searchRoutes from './search.routes';
import payrollRoutes from './payroll.routes';
import fbRoutes from './fb.routes';
import auditRoutes from './audit.routes';
import userSettingsRoutes from './userSettings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/orders', ordersRoutes);
router.use('/statuses', statusesRoutes);
router.use('/fields', fieldsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/search', searchRoutes);
router.use('/payroll', payrollRoutes);
router.use('/fb-accounts', fbRoutes);
router.use('/audit', auditRoutes);
router.use('/user-settings', userSettingsRoutes);

export default router;
