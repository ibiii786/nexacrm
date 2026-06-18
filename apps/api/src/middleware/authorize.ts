import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelpers';
import { PermissionName } from '@nexacrm/shared';
// We will import PermissionService here in Phase 3
// import { PermissionsService } from '../services/permissions.service';

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

      // TODO (Phase 3): Resolve effective permissions from Redis/DB
      // const effectivePermissions = await PermissionsService.getEffectivePermissions(user.id);
      const effectivePermissions: string[] = []; // Placeholder until Phase 3

      const hasPermission = requiredPermissions.some(perm => 
        effectivePermissions.includes(perm)
      );

      // Temporary bypass for Phase 2 until Phase 3 IAM is built
      // We'll allow ADMINs to bypass for now so we can test routes
      if (user.role === 'ADMIN') {
         return next();
      }

      if (!hasPermission && user.role !== 'ADMIN') {
        // Strict enforcement disabled temporarily for Phase 2
        // return sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
