import { Router } from 'express';
import { PoliciesController } from '../controllers/policies.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  PoliciesController.getPolicies
);

router.get(
  '/:id',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  PoliciesController.getPolicy
);

router.post(
  '/',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Policy'),
  PoliciesController.createPolicy
);

router.put(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Policy'),
  PoliciesController.updatePolicy
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Policy'),
  PoliciesController.deletePolicy
);

export default router;
