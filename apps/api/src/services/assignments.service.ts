import prisma from '../config/database';
import { PermissionsService } from './permissions.service';
import { settingsService } from './settings.service';
import { notificationsService } from './notifications.service';

export class AssignmentsService {
  /**
   * Assign a policy to a user, optionally temporarily
   */
  static async assignPolicyToUser(
    userId: string,
    policyId: string,
    grantedBy: string,
    expiresAt?: Date
  ) {
    const res = await prisma.userPolicy.create({
      data: {
        userId,
        policyId,
        grantedBy,
        expiresAt,
        isActive: true,
      }
    });

    // Invalidate user's permission cache
    await PermissionsService.invalidateUserCache(userId);
    return res;
  }

  /**
   * Revoke a policy assignment manually
   */
  static async revokePolicyAssignment(id: string) {
    const assignment = await prisma.userPolicy.findUnique({
      where: { id }
    });

    if (!assignment) return null;

    const res = await prisma.userPolicy.delete({
      where: { id }
    });

    // Invalidate user cache
    await PermissionsService.invalidateUserCache(assignment.userId);
    return res;
  }

  /**
   * Gets all direct policy assignments for a user
   */
  static async getUserAssignments(userId: string) {
    return prisma.userPolicy.findMany({
      where: { userId },
      include: {
        policy: {
          select: { name: true, description: true }
        },
        grantor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { grantedAt: 'desc' }
    });
  }

  /**
   * Called by a Bull background job to clean up expired permissions
   */
  static async cleanupExpiredAssignments() {
    const expired = await prisma.userPolicy.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() }
      }
    });

    if (expired.length === 0) return 0;

    // We mark them as inactive (or we could delete them)
    // The blueprint says "revoke expired assignments", marking inactive is good for audit history
    await prisma.userPolicy.updateMany({
      where: {
        id: { in: expired.map(e => e.id) }
      },
      data: {
        isActive: false
      }
    });

    // Invalidate caches
    const userIds = new Set(expired.map(e => e.userId));
    for (const userId of userIds) {
      await PermissionsService.invalidateUserCache(userId);
    }

    return expired.length;
  }

  static async notifyExpiringAssignments() {
    // Find assignments expiring in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const expiring = await prisma.userPolicy.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
          lte: tomorrow
        }
      },
      include: {
        policy: true
      }
    });

    const sendEmail = (await settingsService.getSettingByKey('emailNotifyPermissionExpiring', 'true')) === 'true';
    if (sendEmail) {
      for (const e of expiring) {
        notificationsService.createNotification({
          userId: e.userId,
          type: 'PERMISSION_EXPIRING',
          title: `Permission Expiring Soon`,
          body: `Your access to the policy "${e.policy.name}" will expire on ${e.expiresAt?.toLocaleDateString()}.`,
          link: `/profile`,
          sendEmailNotification: true,
        }).catch(err => console.error(err));
      }
    }
    
    return expiring.length;
  }
}
