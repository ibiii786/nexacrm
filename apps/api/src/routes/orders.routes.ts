import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { UploadService } from '../services/upload.service';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

// Smart Paste Parser — MUST be registered before /:id to avoid being matched as an ID
router.post(
  '/parse-paste',
  authorize([PERMISSIONS.ORDERS_CREATE]),
  OrdersController.parsePaste
);

// Orders CRUD
router.get(
  '/',
  OrdersController.getOrders
);

router.get(
  '/export/excel',
  OrdersController.exportOrdersExcel
);

router.post(
  '/',
  authorize([PERMISSIONS.ORDERS_CREATE]),
  OrdersController.createOrder
);

router.put(
  '/bulk/status',
  authorize([PERMISSIONS.ORDERS_EDIT_OWN, PERMISSIONS.ORDERS_EDIT_ANY]),
  OrdersController.bulkUpdateStatus
);

router.delete(
  '/bulk/delete',
  authorize([PERMISSIONS.ORDERS_DELETE_OWN, PERMISSIONS.ORDERS_DELETE_ANY]),
  OrdersController.bulkDelete
);

router.get(
  '/:id',
  OrdersController.getOrder
);

router.get(
  '/:id/copy-text',
  OrdersController.getOrderCopyText
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
  UploadService.single('file'),
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
