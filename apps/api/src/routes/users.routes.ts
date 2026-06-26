import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';

import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { systemAuditLogger } from '../middleware/auditLogger';
import { PERMISSIONS } from '../shared';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
});

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
  // Allow self-access (user viewing own profile) or admins
  (req, res, next) => {
    const requestingUserId = (req as any).user?.id;
    if (requestingUserId && requestingUserId === req.params.id) {
      return next(); // Self-access allowed
    }
    return authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE])(req, res, next);
  },
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

// Assignments (Temporary & Permanent User Permissions)
router.post(
  '/:id/permissions',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('UserPermission'),
  UsersController.grantPermission
);

router.delete(
  '/:id/permissions/:permissionId',
  authorize([PERMISSIONS.USERS_MANAGE]),
  systemAuditLogger('UserPermission'),
  UsersController.revokePermission
);

// Change password (self or admin)
router.put(
  '/:id/password',
  systemAuditLogger('PasswordChange'),
  UsersController.changePassword
);

export default router;
