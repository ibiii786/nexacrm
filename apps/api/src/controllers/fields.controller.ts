import { Request, Response, NextFunction } from 'express';
import { FieldsService } from '../services/fields.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class FieldsController {
  static async getFields(req: Request, res: Response, next: NextFunction) {
    try {
      const fields = await FieldsService.getFields();
      return sendSuccess(res, fields);
    } catch (error) {
      next(error);
    }
  }

  static async getField(req: Request, res: Response, next: NextFunction) {
    try {
      const field = await FieldsService.getFieldById(req.params.id);
      if (!field) return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      return sendSuccess(res, field);
    } catch (error) {
      next(error);
    }
  }

  static async createField(req: Request, res: Response, next: NextFunction) {
    try {
      const addedBy = (req as any).user.id;
      const { name, label, type, isRequired, isVisible, isGlobal, options, position } = req.body;

      if (!name || !label || !type || position === undefined) {
        return sendError(res, 'VALIDATION_ERROR', 'Name, label, type, and position are required');
      }

      const field = await FieldsService.createField({
        name,
        label,
        type,
        isRequired,
        isVisible,
        isGlobal,
        options,
        position,
        addedBy
      });

      return sendSuccess(res, field, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateField(req: Request, res: Response, next: NextFunction) {
    try {
      const field = await FieldsService.updateField(req.params.id, req.body);
      return sendSuccess(res, field);
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      next(error);
    }
  }

  static async deleteField(req: Request, res: Response, next: NextFunction) {
    try {
      await FieldsService.deleteField(req.params.id);
      return sendSuccess(res, { message: 'Field deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      next(error);
    }
  }
}
