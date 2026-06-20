import prisma from '../config/database';
import { OrderSequenceService } from './orderSequence.service';
import { StatusesService } from './statuses.service';
import { OrderAuditLogService } from './orderAuditLog.service';
import { notificationsService } from './notifications.service';
import { settingsService } from './settings.service';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Custom error class for edit window expiration.
 * Allows controllers to distinguish this from generic errors.
 */
export class EditWindowExpiredError extends Error {
  constructor() {
    super('The edit window for this order has expired. Only Admins can edit orders after the edit window.');
    this.name = 'EditWindowExpiredError';
  }
}

/**
 * Checks whether the edit window has expired for an order.
 * If expired AND user is not ADMIN/SUPER_ADMIN, throws EditWindowExpiredError.
 * Blueprint Section 12 point 4: order.createdAt + editWindowMinutes. If now() > that, reject for non-admins.
 */
async function enforceEditWindow(orderCreatedAt: Date, userRole: string): Promise<void> {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return; // Admins bypass edit window
  }

  const editWindowMinutes = parseInt(
    await settingsService.getSettingByKey('editWindowMinutes', '30'),
    10
  );

  const windowEnd = new Date(orderCreatedAt.getTime() + editWindowMinutes * 60 * 1000);

  if (new Date() > windowEnd) {
    throw new EditWindowExpiredError();
  }
}

/**
 * Validates and coerces a custom field value based on its type definition.
 */
function validateFieldValue(field: any, value: any): any {
  if (value === null || value === undefined || value === '') return value;

  let val = value;
  
  switch (field.type) {
    case 'NUMBER':
      val = Number(val);
      if (isNaN(val)) throw new Error(`Field ${field.name} must be a valid number`);
      break;
    case 'DATE':
      const date = new Date(val);
      if (isNaN(date.getTime())) throw new Error(`Field ${field.name} must be a valid date`);
      val = date.toISOString();
      break;
    case 'BOOLEAN':
      val = Boolean(val);
      break;
    default: // TEXT, EMAIL, URL, SELECT, etc.
      if (typeof val === 'string') val = DOMPurify.sanitize(val);
  }
  
  return val;
}

export class OrdersService {
  static async getOrders(params?: {
    statusId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { deletedAt: null };
    if (params?.statusId) where.statusId = params.statusId;
    if (params?.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params?.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params?.endDate) {
        // Treat endDate as inclusive of the full day
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          status: true,
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  static async getOrderCopyText(id: string) {
    const order = await this.getOrderById(id);
    if (!order) return null;

    const fields = await StatusesService.getFieldsForStatus(order.statusId);
    
    // Sort fields by copyPosition, then position
    const copyableFields = fields
      .filter(f => f.isCopyable)
      .sort((a, b) => {
        if (a.copyPosition !== null && b.copyPosition !== null) return a.copyPosition - b.copyPosition;
        if (a.copyPosition !== null) return -1;
        if (b.copyPosition !== null) return 1;
        return a.position - b.position;
      });

    const lines: string[] = [];
    for (const field of copyableFields) {
      let value: any = undefined;

      // Same pattern as createOrder
      if (['orderStatus', 'deliveryDate', 'notes', 'orderNumber', 'orderDate', 'createdBy'].includes(field.name)) {
        if (field.name === 'orderStatus') value = order.status?.name;
        if (field.name === 'deliveryDate') value = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : undefined;
        if (field.name === 'notes') value = order.notes;
        if (field.name === 'orderNumber') value = order.orderNumber;
        if (field.name === 'orderDate') value = new Date(order.createdAt).toLocaleDateString();
        if (field.name === 'createdBy') value = order.creator?.name;
      } else {
        const customFields = order.customFields as any;
        value = customFields[field.id] !== undefined ? customFields[field.id] : customFields[field.name];
      }

      if (value !== undefined && value !== null && value !== '') {
        lines.push(`${field.label}: ${value}`);
      }
    }

    return lines.join('\n');
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
      // Native fields check
      if (['orderStatus', 'deliveryDate', 'notes', 'orderNumber', 'orderDate', 'createdBy'].includes(field.name)) {
        if (field.name === 'orderStatus' && field.isRequired && !data.statusId) throw new Error(`Field ${field.name} is required for this status`);
        if (field.name === 'deliveryDate' && field.isRequired && !data.deliveryDate) throw new Error(`Field ${field.name} is required for this status`);
        if (field.name === 'notes' && field.isRequired && !data.notes) throw new Error(`Field ${field.name} is required for this status`);
        // orderNumber, orderDate, createdBy are auto-generated, no user input required
        continue;
      }

      const value = data.customFields[field.id] !== undefined ? data.customFields[field.id] : data.customFields[field.name];
      if (value !== undefined && value !== null && value !== '') {
        validatedCustomFields[field.name] = validateFieldValue(field, value);
      } else if (field.isRequired) {
        throw new Error(`Field ${field.name} is required for this status`);
      }
    }

    // 2.5 Duplicate prevention: check for identical order created within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        statusId: data.statusId
      },
      select: { customFields: true, notes: true, deliveryDate: true }
    });

    const isDuplicate = recentOrders.some(order => {
      const orderNotes = order.notes || '';
      const dataNotes = data.notes || '';
      if (orderNotes !== dataNotes) return false;
      
      const orderDate = order.deliveryDate ? order.deliveryDate.getTime() : null;
      const dataDate = data.deliveryDate ? data.deliveryDate.getTime() : null;
      if (orderDate !== dataDate) return false;
      
      const existing = order.customFields as any;
      if (!existing) return false;

      const newKeys = Object.keys(validatedCustomFields);
      const oldKeys = Object.keys(existing);
      
      if (newKeys.length !== oldKeys.length) return false;
      // If there are no custom fields and no notes, we don't consider it a blockable duplicate 
      // just to be safe, but usually there are fields.
      if (newKeys.length === 0 && !data.notes) return false;

      return newKeys.every(key => existing[key] === validatedCustomFields[key]);
    });

    if (isDuplicate) {
      throw new Error('An identical order was just created. Please avoid duplicate submissions.');
    }

    // 3. Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        statusId: data.statusId,
        createdBy: data.createdBy,
        deliveryDate: data.deliveryDate,
        customFields: validatedCustomFields,
        notes: data.notes ? DOMPurify.sanitize(data.notes) : undefined,
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
    userRole: string;
  }) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { status: true }
    });

    if (!existingOrder) throw new Error('Order not found');

    // Enforce edit window — reject if expired for non-admin users
    await enforceEditWindow(existingOrder.createdAt, data.userRole);

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

      // Trigger Notification to the creator (if it wasn't the creator who updated it)
      if (existingOrder.createdBy !== data.updatedBy) {
        const sendEmailNotification = (await settingsService.getSettingByKey('emailNotifyOrderStatusChanged', 'true')) === 'true';
        notificationsService.createNotification({
          userId: existingOrder.createdBy,
          type: 'ORDER_STATUS_CHANGED',
          title: `Order ${existingOrder.orderNumber} status changed`,
          body: `The status of your order ${existingOrder.orderNumber} was changed from ${existingOrder.status.name} to ${newStatus?.name || data.statusId}.`,
          link: `/orders/${id}`,
          sendEmailNotification,
        }).catch(err => console.error('Failed to create notification', err));
      }
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
      updateData.notes = data.notes ? DOMPurify.sanitize(data.notes) : null;
    }

    // Validate and merge custom fields
    if (data.customFields) {
      const currentStatusId = updateData.statusId || existingOrder.statusId;
      const allowedFields = await StatusesService.getFieldsForStatus(currentStatusId);
      
      const mergedFields = { ...((existingOrder.customFields as any) || {}) };
      
      for (const field of allowedFields) {
        if (['orderStatus', 'deliveryDate', 'notes', 'orderNumber', 'orderDate', 'createdBy'].includes(field.name)) {
          continue;
        }

        const value = data.customFields[field.id] !== undefined ? data.customFields[field.id] : data.customFields[field.name];
        if (value !== undefined) {
          const oldVal = mergedFields[field.name];
          const newVal = validateFieldValue(field, value);
          
          if ((newVal === null || newVal === undefined || newVal === '') && field.isRequired) {
            throw new Error(`Field ${field.name} is required for this status`);
          }

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

    // If status changed, ensure all required fields for the new status are present
    // in the resulting customFields (either newly updated or already existing)
    if (updateData.statusId) {
      const allowedFields = await StatusesService.getFieldsForStatus(updateData.statusId);
      const fieldsToCheck = updateData.customFields || (existingOrder.customFields as any) || {};
      for (const field of allowedFields) {
        if (['orderNumber', 'orderDate', 'createdBy'].includes(field.name)) continue;

        if (field.isRequired) {
          let val = fieldsToCheck[field.name];

          if (field.name === 'orderStatus') val = updateData.statusId;
          else if (field.name === 'deliveryDate') val = ('deliveryDate' in updateData ? updateData.deliveryDate : existingOrder.deliveryDate);
          else if (field.name === 'notes') val = ('notes' in updateData ? updateData.notes : existingOrder.notes);

          if (val === undefined || val === null || val === '') {
            throw new Error(`Field ${field.name} is required to move to this status`);
          }
        }
      }
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

  static async deleteOrder(id: string, deletedBy: string, userRole: string) {
    // Fetch order to check edit window
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    // Enforce edit window — reject if expired for non-admin users
    await enforceEditWindow(order.createdAt, userRole);

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

  static async bulkUpdateStatus(ids: string[], statusId: string, updatedBy: string, userRole: string) {
    const successful: string[] = [];
    const failed: { id: string, reason: string }[] = [];
    for (const id of ids) {
      try {
        await this.updateOrder(id, { statusId, updatedBy, userRole });
        successful.push(id);
      } catch (error: any) {
        failed.push({ id, reason: error.message });
      }
    }
    return { successful, failed };
  }

  static async bulkDelete(ids: string[], deletedBy: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new Error('Only admins can delete orders');
    }
    const successful: string[] = [];
    const failed: { id: string, reason: string }[] = [];
    for (const id of ids) {
      try {
        await this.deleteOrder(id, deletedBy, userRole);
        successful.push(id);
      } catch (error: any) {
        failed.push({ id, reason: error.message });
      }
    }
    return { successful, failed };
  }
}
