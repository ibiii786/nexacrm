import { Router } from 'express';
import { StatusesController } from '../controllers/statuses.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  StatusesController.getStatuses
);

router.get(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  StatusesController.getStatus
);

router.get(
  '/:id/fields',
  authorize([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  StatusesController.getStatusFields
);

router.post(
  '/',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.createStatus
);

router.put(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.updateStatus
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.deleteStatus
);

export default router;
