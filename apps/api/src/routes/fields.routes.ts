import { Router } from 'express';
import { FieldsController } from '../controllers/fields.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  FieldsController.getFields
);

router.get(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]),
  FieldsController.getField
);

router.post(
  '/',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Field'),
  FieldsController.createField
);

router.put(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Field'),
  FieldsController.updateField
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.SETTINGS_MANAGE]),
  systemAuditLogger('Field'),
  FieldsController.deleteField
);

export default router;
