import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { UserSettingsService } = await import('../services/userSettings.service');
    const settings = await UserSettingsService.getSettings(userId);
    res.json({ success: true, data: settings });
  } catch (e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { UserSettingsService } = await import('../services/userSettings.service');
    await UserSettingsService.setSettings(userId, req.body);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
