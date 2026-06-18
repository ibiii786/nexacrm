import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { sendSuccess } from '../utils/responseHelpers';

export class NotificationsController {
  async getNotifications(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // We expect the user object to be populated by the authenticate middleware
    const userId = (req as any).user.id;

    const result = await notificationsService.getNotifications(userId, page, limit);
    return sendSuccess(res, result.notifications, result.meta);
  }

  async markAsRead(req: Request, res: Response) {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    
    await notificationsService.markAsRead(id, userId);
    return sendSuccess(res, { success: true });
  }

  async markAllAsRead(req: Request, res: Response) {
    const userId = (req as any).user.id;
    
    await notificationsService.markAllAsRead(userId);
    return sendSuccess(res, { success: true });
  }

  async deleteNotification(req: Request, res: Response) {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    
    await notificationsService.deleteNotification(id, userId);
    return sendSuccess(res, { success: true });
  }
}

export const notificationsController = new NotificationsController();
