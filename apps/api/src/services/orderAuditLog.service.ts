import prisma from '../config/database';

export class OrderAuditLogService {
  static async logAction(data: {
    orderId: string;
    userId: string;
    action: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
  }) {
    return prisma.orderAuditLog.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        action: data.action,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
      }
    });
  }

  static async getLogsForOrder(orderId: string) {
    return prisma.orderAuditLog.findMany({
      where: { orderId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
