import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/responseHelpers';

export class DashboardController {
  static async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }
      const previousLoginAt = user.previousLoginAt as string | undefined;
      const stats = await DashboardService.getAdminDashboardStats(previousLoginAt);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const previousLoginAt = user.previousLoginAt as string | undefined;
      const stats = await DashboardService.getUserDashboardStats(user.id, previousLoginAt);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}
