import prisma from '../config/database';
import { sendEmail } from '../utils/email';
import { logger } from '../config/logger';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  sendEmailNotification?: boolean;
}

export class NotificationsService {
  /**
   * Get paginated notifications for a user
   */
  async getNotifications(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Create a new notification and optionally send an email
   */
  async createNotification(data: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        link: data.link,
      },
    });

    if (data.sendEmailNotification) {
      // Look up user's email
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true }
      });

      if (user && user.email) {
        // Send email in background
        sendEmail({
          to: user.email,
          subject: data.title,
          text: `${data.body || ''}\n\nView details: ${data.link || ''}`,
          html: `<p>Hello ${user.name},</p><p>${data.body || ''}</p><a href="${data.link || ''}">View details</a>`
        }).catch(err => {
          logger.error('Failed to send email notification', { error: err, notificationId: notification.id });
        });
      }
    }

    return notification;
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: string, userId: string) {
    // Ensure it belongs to the user
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }
}

export const notificationsService = new NotificationsService();
