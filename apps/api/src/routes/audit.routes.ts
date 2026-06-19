import { Router } from 'express';
import { AuditService } from '../services/audit.service';
import { authenticate } from '../middleware/authenticate';
import { sendSuccess } from '../utils/responseHelpers';

const router = Router();

router.use(authenticate);
// Require SUPER_ADMIN role for system audit logs
// Handled inside the route handler

router.get('/', async (req, res, next) => {
  try {
    const { actorId, entity, action, page = '1', limit = '50' } = req.query;
    
    // We can restrict to SUPER_ADMIN explicitly
    if ((req as any).user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden. Only Super Admins can view the system audit log.' });
    }

    const filters: any = {};
    if (actorId) filters.actorId = actorId as string;
    if (entity) filters.entity = entity as string;
    if (action) filters.action = action as string;

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditService.getAuditLogs(filters, skip, Number(limit));
    
    return sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

export default router;
