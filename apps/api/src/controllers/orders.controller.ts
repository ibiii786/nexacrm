import { Request, Response, NextFunction } from 'express';
import { OrdersService } from '../services/orders.service';
import { AttachmentsService } from '../services/attachments.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup local multer storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });

export class OrdersController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { statusId, search } = req.query;
      const orders = await OrdersService.getOrders({
        statusId: statusId as string,
        search: search as string,
      });
      return sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrdersService.getOrderById(req.params.id);
      if (!order) return sendError(res, 'NOT_FOUND', 'Order not found', 404);
      return sendSuccess(res, order);
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
      const updatedBy = (req as any).user.id;
      const { statusId, deliveryDate, customFields, notes } = req.body;

      const order = await OrdersService.updateOrder(req.params.id, {
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        customFields,
        notes,
        updatedBy
      });

      return sendSuccess(res, order);
    } catch (error: any) {
      if (error.message === 'Order not found') return sendError(res, 'NOT_FOUND', error.message, 404);
      next(error);
    }
  }

  static async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedBy = (req as any).user.id;
      await OrdersService.deleteOrder(req.params.id, deletedBy);
      return sendSuccess(res, { message: 'Order deleted' });
    } catch (error) {
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
      const { id: orderId } = req.params;

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
      await AttachmentsService.deleteAttachment(req.params.attachmentId);
      return sendSuccess(res, { message: 'Attachment deleted' });
    } catch (error: any) {
      if (error.message === 'Attachment not found') {
        return sendError(res, 'NOT_FOUND', error.message, 404);
      }
      next(error);
    }
  }
}
