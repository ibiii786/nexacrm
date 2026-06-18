import { Request, Response } from 'express';
import { announcementsService } from '../services/announcements.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isActive: z.boolean().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

export class AnnouncementsController {
  async getAnnouncements(req: Request, res: Response) {
    // If user is Admin/SuperAdmin, they can see inactive announcements too if they want
    // But default endpoint might just fetch all for admin, and only active for users
    // Let's rely on a query param
    const onlyActive = req.query.all !== 'true';
    
    const announcements = await announcementsService.getAllAnnouncements(onlyActive);
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
