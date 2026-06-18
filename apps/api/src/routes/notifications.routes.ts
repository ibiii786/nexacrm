import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';


const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications
router.get('/', notificationsController.getNotifications.bind(notificationsController));

// PUT /api/notifications/read-all
router.put('/read-all', notificationsController.markAllAsRead.bind(notificationsController));

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));

// DELETE /api/notifications/:id
router.delete('/:id', notificationsController.deleteNotification.bind(notificationsController));

export default router;
