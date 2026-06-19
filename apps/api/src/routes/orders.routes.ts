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
  // Any authenticated user can view orders
  OrdersController.getOrders
);

router.get(
  '/export/excel',
  OrdersController.exportOrdersExcel
);

router.get(
  '/:id',
  // Any authenticated user can view an order
  OrdersController.getOrder
);

router.post(
  '/',
  authorize([PERMISSIONS.ORDERS_CREATE]),
  OrdersController.createOrder
);

// Smart Paste Parser — must be before /:id routes
router.post(
  '/parse-paste',
  authorize([PERMISSIONS.ORDERS_CREATE]),
  OrdersController.parsePaste
);

router.put(
  '/:id',
  authorize([PERMISSIONS.ORDERS_EDIT_OWN, PERMISSIONS.ORDERS_EDIT_ANY]),
  OrdersController.updateOrder
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.ORDERS_DELETE_OWN, PERMISSIONS.ORDERS_DELETE_ANY]),
  OrdersController.deleteOrder
);

// Attachments
router.post(
  '/:id/attachments',
  authorize([PERMISSIONS.ORDERS_EDIT_OWN, PERMISSIONS.ORDERS_EDIT_ANY]),
  upload.single('file'),
  systemAuditLogger('Attachment'),
  OrdersController.uploadAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize([PERMISSIONS.ORDERS_EDIT_OWN, PERMISSIONS.ORDERS_EDIT_ANY]),
  systemAuditLogger('Attachment'),
  OrdersController.deleteAttachment
);

export default router;
