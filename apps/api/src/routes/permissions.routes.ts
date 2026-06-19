import { Router } from 'express';
import { PermissionsController } from '../controllers/permissions.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]),
  PermissionsController.getPermissions
);

export default router;
