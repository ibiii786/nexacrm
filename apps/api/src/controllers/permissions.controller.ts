import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class PermissionsController {
  static async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await PermissionsService.getPermissions();
      return sendSuccess(res, permissions);
    } catch (error) {
      next(error);
    }
  }
}
