import prisma from '../config/database';
import { OrderSequenceService } from './orderSequence.service';
import { StatusesService } from './statuses.service';
import { OrderAuditLogService } from './orderAuditLog.service';

export class OrdersService {
  static async getOrders(params?: {
    statusId?: string;
    search?: string;
  }) {
    const where: any = {};
    if (params?.statusId) where.statusId = params.statusId;
    if (params?.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        // Could expand search to customFields JSON if needed, but keeping simple
      ];
    }

    return prisma.order.findMany({
      where,
      include: {
        status: true,
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        status: true,
        creator: { select: { id: true, name: true } },
        attachments: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } }
        }
      }
    });
  }

  static async createOrder(data: {
    statusId: string;
    deliveryDate?: Date;
    customFields: any;
    notes?: string;
    createdBy: string;
  }) {
    // 1. Generate sequential order number
    const orderNumber = await OrderSequenceService.generateNextOrderNumber();

    // 2. Validate customFields against status fields
    const allowedFields = await StatusesService.getFieldsForStatus(data.statusId);
    const validatedCustomFields: any = {};

    for (const field of allowedFields) {
      if (data.customFields[field.name] !== undefined) {
        // Basic type casting / validation could go here
        validatedCustomFields[field.name] = data.customFields[field.name];
      } else if (field.isRequired) {
        throw new Error(`Field ${field.name} is required for this status`);
      }
    }

    // 3. Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        statusId: data.statusId,
        createdBy: data.createdBy,
        deliveryDate: data.deliveryDate,
        customFields: validatedCustomFields,
        notes: data.notes,
      },
      include: {
        status: true
      }
    });

    // 4. Log creation audit trail
    await OrderAuditLogService.logAction({
      orderId: order.id,
      userId: data.createdBy,
      action: 'ORDER_CREATED',
      newValue: JSON.stringify({ status: order.status.name })
    });

    return order;
  }

  static async updateOrder(id: string, data: {
    statusId?: string;
    deliveryDate?: Date;
    customFields?: any;
    notes?: string;
    updatedBy: string;
  }) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { status: true }
    });

    if (!existingOrder) throw new Error('Order not found');

    const updateData: any = {};
    const auditLogs: any[] = [];

    // Check status change
    if (data.statusId && data.statusId !== existingOrder.statusId) {
      updateData.statusId = data.statusId;
      const newStatus = await prisma.status.findUnique({ where: { id: data.statusId } });
      auditLogs.push({
        action: 'STATUS_CHANGED',
        fieldName: 'status',
        oldValue: existingOrder.status.name,
        newValue: newStatus?.name || data.statusId
      });
    }

    // Check delivery date
    if (data.deliveryDate !== undefined && data.deliveryDate?.getTime() !== existingOrder.deliveryDate?.getTime()) {
      updateData.deliveryDate = data.deliveryDate;
      auditLogs.push({
        action: 'DELIVERY_DATE_CHANGED',
        fieldName: 'deliveryDate',
        oldValue: existingOrder.deliveryDate?.toISOString(),
        newValue: data.deliveryDate?.toISOString()
      });
    }

    // Handle notes
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Validate and merge custom fields
    if (data.customFields) {
      const currentStatusId = updateData.statusId || existingOrder.statusId;
      const allowedFields = await StatusesService.getFieldsForStatus(currentStatusId);
      
      const mergedFields = { ...((existingOrder.customFields as any) || {}) };
      
      for (const field of allowedFields) {
        if (data.customFields[field.name] !== undefined) {
          const oldVal = mergedFields[field.name];
          const newVal = data.customFields[field.name];
          
          if (oldVal !== newVal) {
            mergedFields[field.name] = newVal;
            auditLogs.push({
              action: 'FIELD_UPDATED',
              fieldName: field.name,
              oldValue: JSON.stringify(oldVal),
              newValue: JSON.stringify(newVal)
            });
          }
        }
      }
      
      updateData.customFields = mergedFields;
    }

    // If nothing changed, just return
    if (Object.keys(updateData).length === 0) {
      return existingOrder;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { status: true, creator: { select: { id: true, name: true } } }
    });

    // Write audit logs
    for (const log of auditLogs) {
      await OrderAuditLogService.logAction({
        orderId: id,
        userId: data.updatedBy,
        action: log.action,
        fieldName: log.fieldName,
        oldValue: log.oldValue,
        newValue: log.newValue
      });
    }

    return updatedOrder;
  }

  static async deleteOrder(id: string, deletedBy: string) {
    // Soft delete is handled by Prisma $extends configuration
    await prisma.order.delete({
      where: { id }
    });

    await OrderAuditLogService.logAction({
      orderId: id,
      userId: deletedBy,
      action: 'ORDER_DELETED',
    });
  }
}
