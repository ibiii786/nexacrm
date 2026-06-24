import { Request, Response } from 'express';
import { announcementsService } from '../services/announcements.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

export class AnnouncementsController {
  async getAnnouncements(req: Request, res: Response) {
    const currentUser = (req as any).user;
    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    const announcements = await announcementsService.getAllAnnouncements({
      onlyActive: !isAdminOrSuper,
      includeExpired: isAdminOrSuper,
      // For regular users and admins who are not super admin, apply new-user date filter
      userCreatedAt: isAdminOrSuper ? undefined : new Date(currentUser.createdAt),
    });

    return sendSuccess(res, announcements);
  }

  async getAnnouncement(req: Request, res: Response) {
    const id = req.params.id as string;
    const announcement = await announcementsService.getAnnouncementById(id);
    
    if (!announcement) {
      return sendError(res, 'NOT_FOUND', 'Announcement not found', 404);
    }
    
    return sendSuccess(res, announcement);
  }

  async createAnnouncement(req: Request, res: Response) {
    const data = createSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const announcement = await announcementsService.createAnnouncement(data, userId);
    return sendSuccess(res, announcement, undefined, 201);
  }

  async updateAnnouncement(req: Request, res: Response) {
    const id = req.params.id as string;
    const data = updateSchema.parse(req.body);
    
    const announcement = await announcementsService.updateAnnouncement(id, data);
    return sendSuccess(res, announcement);
  }

  async deleteAnnouncement(req: Request, res: Response) {
    const id = req.params.id as string;
    await announcementsService.deleteAnnouncement(id);
    return sendSuccess(res, { success: true });
  }
}

export const announcementsController = new AnnouncementsController();
