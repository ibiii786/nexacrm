import { Request, Response, NextFunction } from 'express';
import { FieldsService } from '../services/fields.service';
import { PermissionsService } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { PERMISSIONS } from '@nexacrm/shared';

export class FieldsController {
  static async getFields(req: Request, res: Response, next: NextFunction) {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const fields = await FieldsService.getFields(includeArchived);
      return sendSuccess(res, fields);
    } catch (error) {
      next(error);
    }
  }

  static async getField(req: Request, res: Response, next: NextFunction) {
    try {
      const field = await FieldsService.getFieldById((req.params.id as string));
      if (!field) return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      return sendSuccess(res, field);
    } catch (error) {
      next(error);
    }
  }

  static async createField(req: Request, res: Response, next: NextFunction) {
    try {
      const addedBy = (req as any).user.id;
      const { name, label, type, isRequired, isVisible, isGlobal, options, position, isCopyable, copyPosition } = req.body;

      if (!name || !label || !type || position === undefined) {
        return sendError(res, 'VALIDATION_ERROR', 'Name, label, type, and position are required');
      }

      let finalIsRequired = !!isRequired;
      const user = (req as any).user;
      if (user.role !== 'SUPER_ADMIN' && finalIsRequired) {
        const perms = await PermissionsService.getEffectivePermissions(user.id);
        if (!perms.includes(PERMISSIONS.FIELDS_MAKE_REQUIRED)) {
          finalIsRequired = false;
        }
      }

      const field = await FieldsService.createField({
        name,
        label,
        type,
        isRequired: finalIsRequired,
        isVisible,
        isGlobal,
        options,
        position,
        isCopyable,
        copyPosition,
        addedBy
      });

      return sendSuccess(res, field, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateField(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.body };
      if (payload.isRequired !== undefined) {
        let finalIsRequired = !!payload.isRequired;
        const user = (req as any).user;
        if (user.role !== 'SUPER_ADMIN' && finalIsRequired) {
          const perms = await PermissionsService.getEffectivePermissions(user.id);
          if (!perms.includes(PERMISSIONS.FIELDS_MAKE_REQUIRED)) {
            finalIsRequired = false;
          }
        }
        payload.isRequired = finalIsRequired;
      }
      const field = await FieldsService.updateField((req.params.id as string), payload);
      return sendSuccess(res, field);
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      next(error);
    }
  }

  static async deleteField(req: Request, res: Response, next: NextFunction) {
    try {
      await FieldsService.deleteField((req.params.id as string));
      return sendSuccess(res, { message: 'Field deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Field not found', 404);
      next(error);
    }
  }
}
