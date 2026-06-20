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
  // Authenticated users can view
  StatusesController.getStatuses
);

router.put(
  '/reorder',
  authorize([PERMISSIONS.STATUS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.reorderStatuses
);

router.get(
  '/:id',
  // Authenticated users can view
  StatusesController.getStatus
);

router.get(
  '/:id/fields',
  // Authenticated users can view
  StatusesController.getStatusFields
);

router.post(
  '/',
  authorize([PERMISSIONS.STATUS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.createStatus
);

router.put(
  '/:id',
  authorize([PERMISSIONS.STATUS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.updateStatus
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.STATUS_MANAGE]),
  systemAuditLogger('Status'),
  StatusesController.deleteStatus
);

export default router;
