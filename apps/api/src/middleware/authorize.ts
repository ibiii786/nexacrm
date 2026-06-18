import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelpers';
import { PermissionName } from '@nexacrm/shared';
import { PermissionsService } from '../services/permissions.service';

/**
 * Authorization middleware factory.
 * Verifies if the user has at least one of the required permissions.
 * SUPER_ADMIN always passes.
 */
export function authorize(requiredPermissions: PermissionName[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
      }

      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Resolve effective permissions from Redis/DB
      const effectivePermissions = await PermissionsService.getEffectivePermissions(user.id);

      const hasPermission = requiredPermissions.some(perm => 
        effectivePermissions.includes(perm)
      );

      if (!hasPermission) {
        return sendError(res, 'FORBIDDEN', 'Insufficient permissions to access this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
