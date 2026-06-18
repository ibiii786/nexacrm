import { Router } from 'express';
import { fbController } from '../controllers/fb.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Ensure all FB routes are authenticated
router.use(authenticate);

// We could add authorize([PERMISSIONS.FB_ACCOUNTS_ACCESS]) if we had that permission,
// but for now relying on authentication + module toggle checks in the frontend
// and potentially checking user roles within the controller if needed.

router.get('/', fbController.getFbAccounts.bind(fbController));
router.get('/:id', fbController.getFbAccountById.bind(fbController));
router.post('/', fbController.createFbAccount.bind(fbController));
router.put('/:id', fbController.updateFbAccount.bind(fbController));
router.delete('/:id', fbController.deleteFbAccount.bind(fbController));

// Special route for revealing the vault note, requires password in body
router.post('/:id/reveal', fbController.revealVaultNote.bind(fbController));

export default router;
