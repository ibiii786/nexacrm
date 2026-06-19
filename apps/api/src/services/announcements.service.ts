import prisma from '../config/database';
import DOMPurify from 'isomorphic-dompurify';
import { settingsService } from './settings.service';
import { notificationsService } from './notifications.service';

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  isActive?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  isActive?: boolean;
}

export class AnnouncementsService {
  async getAllAnnouncements(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    
    return prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async getAnnouncementById(id: string) {
    return prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async createAnnouncement(data: CreateAnnouncementInput, userId: string) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: DOMPurify.sanitize(data.content),
        isActive: data.isActive ?? true,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    const sendEmail = (await settingsService.getSettingByKey('emailNotifyAnnouncementPosted', 'true')) === 'true';
    if (sendEmail) {
      const users = await prisma.user.findMany({ select: { id: true } });
      for (const u of users) {
        notificationsService.createNotification({
          userId: u.id,
          type: 'ANNOUNCEMENT_POSTED',
          title: `New Announcement: ${data.title}`,
          body: `A new announcement has been posted: ${data.title}`,
          link: `/announcements`,
          sendEmailNotification: true,
        }).catch(e => console.error(e));
      }
    }
    
    return announcement;
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    const sanitizedData = { ...data };
    if (sanitizedData.content) {
      sanitizedData.content = DOMPurify.sanitize(sanitizedData.content);
    }

    return prisma.announcement.update({
      where: { id },
      data: sanitizedData,
      include: {
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async deleteAnnouncement(id: string) {
    return prisma.announcement.delete({
      where: { id },
    });
  }
}

export const announcementsService = new AnnouncementsService();
