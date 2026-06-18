import { Router } from 'express';
import { announcementsController } from '../controllers/announcements.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

import { validateBody } from '../middleware/validateBody';
import { z } from 'zod';

const router = Router();

// Require auth for all routes
router.use(authenticate);

// Everyone can view announcements
router.get('/', announcementsController.getAnnouncements.bind(announcementsController));
router.get('/:id', announcementsController.getAnnouncement.bind(announcementsController));

// Only users with announcements:manage permission can create/update/delete
router.post(
  '/', 
  authorize(['announcements:manage']),
  announcementsController.createAnnouncement.bind(announcementsController)
);

router.put(
  '/:id', 
  authorize(['announcements:manage']),
  announcementsController.updateAnnouncement.bind(announcementsController)
);

router.delete(
  '/:id', 
  authorize(['announcements:manage']),
  announcementsController.deleteAnnouncement.bind(announcementsController)
);

export default router;
