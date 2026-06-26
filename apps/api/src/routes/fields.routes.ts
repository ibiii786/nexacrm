import { Router } from 'express';
import { FieldsController } from '../controllers/fields.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '../shared';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  // Authenticated users can view
  FieldsController.getFields
);

router.get(
  '/:id',
  // Authenticated users can view
  FieldsController.getField
);

router.post(
  '/',
  authorize([PERMISSIONS.FIELDS_CREATE]),
  systemAuditLogger('Field'),
  FieldsController.createField
);

router.put(
  '/:id',
  authorize([PERMISSIONS.FIELDS_CREATE]),
  systemAuditLogger('Field'),
  FieldsController.updateField
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.FIELDS_CREATE]),
  systemAuditLogger('Field'),
  FieldsController.deleteField
);

export default router;
