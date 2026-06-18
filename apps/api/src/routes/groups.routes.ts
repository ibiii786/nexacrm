import { Router } from 'express';
import { GroupsController } from '../controllers/groups.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

// Basic CRUD
router.get(
  '/',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  GroupsController.getGroups
);

router.get(
  '/:id',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  GroupsController.getGroup
);

router.post(
  '/',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Group'),
  GroupsController.createGroup
);

router.put(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Group'),
  GroupsController.updateGroup
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('Group'),
  GroupsController.deleteGroup
);

// Members
router.post(
  '/:id/members',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('GroupMember'),
  GroupsController.addMember
);

router.delete(
  '/:id/members/:userId',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('GroupMember'),
  GroupsController.removeMember
);

// Policies
router.post(
  '/:id/policies',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('GroupPolicy'),
  GroupsController.attachPolicy
);

router.delete(
  '/:id/policies/:policyId',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('GroupPolicy'),
  GroupsController.detachPolicy
);

export default router;
