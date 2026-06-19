import prisma from '../config/database';
import { Request } from 'express';

export class AuditService {
  /**
   * Log an action to the system audit log
   * @param action The action being performed (e.g. 'LOGIN', 'DELETE_USER', 'CHANGE_PERMISSION')
   * @param entity The type of entity being affected (e.g. 'User', 'Group', 'Policy')
   * @param entityId The ID of the affected entity
   * @param actorId The ID of the user performing the action (can be null for system actions)
   * @param details Additional context or payload details
   * @param req The Express request object to capture IP
   */
  static async log(
    action: string,
    entity: string,
    entityId: string | null = null,
    actorId: string | null = null,
    details: any = null,
    req?: Request
  ) {
    try {
      const ipAddress = req ? (req.ip || req.socket.remoteAddress || null) : null;

      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          actorId,
          details,
          ipAddress,
        }
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // We typically do not want to throw and interrupt the main action if audit logging fails,
      // but we log it to console for debugging.
    }
  }

  static async getAuditLogs(filters?: { actorId?: string, entity?: string, action?: string }, skip: number = 0, take: number = 50) {
    return prisma.auditLog.findMany({
      where: filters,
      include: {
        actor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }
}
