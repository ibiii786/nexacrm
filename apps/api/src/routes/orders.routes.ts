import { Router } from 'express';
import { OrdersController, upload } from '../controllers/orders.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

// Orders CRUD
router.get(
  '/',
  authorize([PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  OrdersController.getOrders
);

router.get(
  '/:id',
  authorize([PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  OrdersController.getOrder
);

router.post(
  '/',
  authorize([PERMISSIONS.ORDERS_MANAGE]),
  OrdersController.createOrder
);

router.put(
  '/:id',
  authorize([PERMISSIONS.ORDERS_MANAGE]),
  OrdersController.updateOrder
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.ORDERS_MANAGE]),
  OrdersController.deleteOrder
);

// Attachments
router.post(
  '/:id/attachments',
  authorize([PERMISSIONS.ORDERS_MANAGE]),
  upload.single('file'),
  systemAuditLogger('Attachment'),
  OrdersController.uploadAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize([PERMISSIONS.ORDERS_MANAGE]),
  systemAuditLogger('Attachment'),
  OrdersController.deleteAttachment
);

export default router;
