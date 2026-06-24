import prisma from '../config/database';
import sanitizeHtml from 'sanitize-html';
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
  async getAllAnnouncements(options: {
    onlyActive?: boolean;
    includeExpired?: boolean;
    userId?: string;
    userCreatedAt?: Date;
  } = {}) {
    const { onlyActive = false, includeExpired = false, userCreatedAt } = options;

    const where: any = {};

    if (onlyActive) where.isActive = true;

    if (!includeExpired) {
      // Exclude expired announcements (expiresAt is in the past)
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }

    // New user visibility: only show announcements from the same calendar day as userCreatedAt onwards
    if (userCreatedAt) {
      const startOfUserCreationDay = new Date(userCreatedAt);
      startOfUserCreationDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfUserCreationDay };
    }

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

  async createAnnouncement(data: CreateAnnouncementInput & { expiresAt?: Date }, userId: string) {
    const defaultExpiryDays = 30;
    const expiresAt = data.expiresAt ?? new Date(Date.now() + defaultExpiryDays * 24 * 60 * 60 * 1000);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: sanitizeHtml(data.content),
        isActive: data.isActive ?? true,
        expiresAt,
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
      sanitizedData.content = sanitizeHtml(sanitizedData.content);
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
