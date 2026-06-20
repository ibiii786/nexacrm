import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateBody';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authenticate';
import { loginSchema } from '@nexacrm/shared';

const router = Router();

router.use(authLimiter); // Apply strict rate limiting to all auth routes

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Other endpoints (me) will be added later when we build the authenticate middleware

export default router;
