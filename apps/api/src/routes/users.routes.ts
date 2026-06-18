import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { AssignmentsController } from '../controllers/assignments.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS, userSchema } from '@nexacrm/shared';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// We attach the audit logger to mutating routes
router.post(
  '/',
  authorize([PERMISSIONS.USERS_MANAGE]),
  validateBody(userSchema),
  systemAuditLogger('User'),
  UsersController.createUser
);

router.get(
  '/',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  UsersController.getUsers
);

router.get(
  '/:id',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  UsersController.getUser
);

router.put(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  // Note: an updateSchema would be better if passwords/roles are optional in updates,
  // but we can rely on partial validation or just the controller handling it for now
  systemAuditLogger('User'),
  UsersController.updateUser
);

router.delete(
  '/:id',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('User'),
  UsersController.deleteUser
);

router.post(
  '/:id/suspend',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('User'),
  UsersController.suspendUser
);

router.post(
  '/:id/unsuspend',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('User'),
  UsersController.unsuspendUser
);

router.post(
  '/:id/force-logout',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('User'),
  UsersController.forceLogout
);

router.get(
  '/:id/effective-permissions',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  UsersController.getEffectivePermissions
);

// Assignments (Temporary & Permanent User Policies)
router.get(
  '/:userId/policies',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  AssignmentsController.getUserAssignments
);

router.post(
  '/:userId/policies',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('UserPolicy'),
  AssignmentsController.assignPolicy
);

router.delete(
  '/:userId/policies/:assignmentId',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('UserPolicy'),
  AssignmentsController.revokeAssignment
);

export default router;
