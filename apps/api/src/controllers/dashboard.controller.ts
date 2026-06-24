import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { PermissionsService } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class DashboardController {
  static async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      let canViewAll = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      if (!canViewAll) {
        const perms = await PermissionsService.getEffectivePermissions(user.id);
        if (perms.includes('orders:view_all')) canViewAll = true;
      }
      
      if (!canViewAll) {
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
