import { Request, Response, NextFunction } from 'express';
import { StatusesService } from '../services/statuses.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class StatusesController {
  static async getStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const statuses = await StatusesService.getStatuses(includeArchived);
      return sendSuccess(res, statuses);
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await StatusesService.getStatusById(req.params.id);
      if (!status) return sendError(res, 'NOT_FOUND', 'Status not found', 404);
      return sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  static async createStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user.id;
      const { name, color, icon, isDefault, position, fieldIds } = req.body;

      if (!name || !color || position === undefined) {
        return sendError(res, 'VALIDATION_ERROR', 'Name, color, and position are required');
      }

      const status = await StatusesService.createStatus({
        name,
        color,
        icon,
        isDefault,
        position,
        createdBy,
        fieldIds
      });

      return sendSuccess(res, status, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await StatusesService.updateStatus(req.params.id, req.body);
      return sendSuccess(res, status);
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Status not found', 404);
      next(error);
    }
  }

  static async deleteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      await StatusesService.deleteStatus(req.params.id);
      return sendSuccess(res, { message: 'Status deleted' });
    } catch (error: any) {
      // Prisma throws P2003 if foreign key constraint fails (orders exist for this status)
      if (error.code === 'P2003') {
        return sendError(res, 'CONFLICT', 'Cannot delete status because orders are attached to it. Archive it instead.', 409);
      }
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Status not found', 404);
      next(error);
    }
  }

  static async getStatusFields(req: Request, res: Response, next: NextFunction) {
    try {
      const fields = await StatusesService.getFieldsForStatus(req.params.id);
      return sendSuccess(res, fields);
    } catch (error) {
      next(error);
    }
  }
}
