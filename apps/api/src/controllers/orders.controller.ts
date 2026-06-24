import { Request, Response, NextFunction } from 'express';
import { OrdersService, EditWindowExpiredError } from '../services/orders.service';
import { AttachmentsService } from '../services/attachments.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { parsePasteText } from '../utils/pasteParser';
import { ExportService } from '../services/export.service';
import { PermissionsService } from '../services/permissions.service';
import prisma from '../config/database';


export class OrdersController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { statusId, search, startDate, endDate, page, limit } = req.query;

      let canViewAll = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!canViewAll) {
        const perms = await PermissionsService.getEffectivePermissions(user.id);
        if (perms.includes('orders:view_all')) canViewAll = true;
      }

      const result = await OrdersService.getOrders({
        statusId: statusId as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        viewingUserId: user.id,
        canViewAll,
      });
      return sendSuccess(res, result.orders, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async exportOrdersExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { statusId, search, startDate, endDate } = req.query;

      let canViewAll = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!canViewAll) {
        const perms = await PermissionsService.getEffectivePermissions(user.id);
        if (perms.includes('orders:view_all')) canViewAll = true;
      }

      const result = await OrdersService.getOrders({
        statusId: statusId as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        // No pagination for export to export all matching records
        limit: 10000,
        viewingUserId: user.id,
        canViewAll, 
      });

      res.setHeader('Content-Disposition', 'attachment; filename="orders_export.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      const stream = await ExportService.generateOrdersExcel(result.orders);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrdersService.getOrderById((req.params.id as string));
      if (!order) return sendError(res, 'NOT_FOUND', 'Order not found', 404);
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderCopyText(req: Request, res: Response, next: NextFunction) {
    try {
      const copyText = await OrdersService.getOrderCopyText((req.params.id as string));
      if (!copyText) return sendError(res, 'NOT_FOUND', 'Order not found', 404);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(copyText);
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user.id;
      const { statusId, deliveryDate, customFields, notes } = req.body;

      if (!statusId) return sendError(res, 'VALIDATION_ERROR', 'statusId is required');

      const order = await OrdersService.createOrder({
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        customFields: customFields || {},
        notes,
        createdBy
      });

      return sendSuccess(res, order, undefined, 201);
    } catch (error: any) {
      if (error.message.includes('required for this status')) {
        return sendError(res, 'VALIDATION_ERROR', error.message);
      }
      next(error);
    }
  }

  static async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { statusId, deliveryDate, customFields, notes } = req.body;

      const order = await OrdersService.updateOrder((req.params.id as string), {
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        customFields,
        notes,
        updatedBy: user.id,
        userRole: user.role,
      });

      return sendSuccess(res, order);
    } catch (error: any) {
      if (error instanceof EditWindowExpiredError) {
        return sendError(res, 'EDIT_WINDOW_EXPIRED', error.message, 403);
      }
      if (error.message === 'Order not found') return sendError(res, 'NOT_FOUND', error.message, 404);
      next(error);
    }
  }

  static async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      await OrdersService.deleteOrder((req.params.id as string), user.id, user.role);
      return sendSuccess(res, { message: 'Order deleted' });
    } catch (error: any) {
      if (error instanceof EditWindowExpiredError) {
        return sendError(res, 'EDIT_WINDOW_EXPIRED', error.message, 403);
      }
      if (error.message === 'Order not found') return sendError(res, 'NOT_FOUND', error.message, 404);
      next(error);
    }
  }

  static async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { ids, statusId } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return sendError(res, 'VALIDATION_ERROR', 'An array of order IDs is required');
      }
      if (!statusId) {
        return sendError(res, 'VALIDATION_ERROR', 'statusId is required');
      }

      const results = await OrdersService.bulkUpdateStatus(ids, statusId, user.id, user.role);
      return sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }

  static async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return sendError(res, 'VALIDATION_ERROR', 'An array of order IDs is required');
      }

      const results = await OrdersService.bulkDelete(ids, user.id, user.role);
      return sendSuccess(res, results);
    } catch (error: any) {
      if (error.message === 'Only admins can delete orders') {
        return sendError(res, 'FORBIDDEN', error.message, 403);
      }
      next(error);
    }
  }

  // Attachments
  static async uploadAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, 'BAD_REQUEST', 'No file uploaded', 400);
      }

      const uploadedBy = (req as any).user.id;
      const orderId = req.params.id as string;

      const attachment = await AttachmentsService.uploadAttachment({
        orderId,
        filename: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy
      });

      return sendSuccess(res, attachment, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      await AttachmentsService.deleteAttachment((req.params.attachmentId as string));
      return sendSuccess(res, { message: 'Attachment deleted' });
    } catch (error: any) {
      if (error.message === 'Attachment not found') {
        return sendError(res, 'NOT_FOUND', error.message, 404);
      }
      next(error);
    }
  }

  // Smart Paste Parser — Blueprint Section 11
  static async parsePaste(req: Request, res: Response, next: NextFunction) {
    try {
      const { rawText } = req.body;

      if (!rawText || typeof rawText !== 'string') {
        return sendError(res, 'VALIDATION_ERROR', 'rawText is required and must be a string');
      }

      // Fetch all visible fields from the database
      const fields = await prisma.field.findMany({
        where: { isVisible: true, isArchived: false },
        select: { id: true, name: true, label: true, type: true },
      });

      const result = parsePasteText(rawText, fields);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
