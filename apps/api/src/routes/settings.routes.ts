import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { PERMISSIONS } from '@nexacrm/shared';

const router = Router();

// Only authenticated users can read settings
router.get('/', authenticate, settingsController.getSettings.bind(settingsController));

// Only Admins can update settings
router.put('/', authenticate, authorize([PERMISSIONS.SETTINGS_ACCESS]), settingsController.updateSettings.bind(settingsController));

export default router;
