import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { PermissionsService } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class UsersController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UsersService.getUsers();
      return sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.getUserById((req.params.id as string));
      if (!user) {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user.id;
      // Assume body is validated by zod schema middleware before reaching here
      const user = await UsersService.createUser({ ...req.body, createdBy });
      return sendSuccess(res, user, undefined, 201);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return sendError(res, 'CONFLICT', 'Email already in use', 409);
      }
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.updateUser((req.params.id as string), req.body);
      return sendSuccess(res, user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }
      if (error.code === 'P2002') {
        return sendError(res, 'CONFLICT', 'Email already in use', 409);
      }
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Prevent deleting self or SUPER_ADMIN (enforced implicitly via role, but good to check self)
      if ((req.params.id as string) === (req as any).user.id) {
        return sendError(res, 'BAD_REQUEST', 'Cannot delete your own account', 400);
      }

      await UsersService.deleteUser((req.params.id as string));
      return sendSuccess(res, { message: 'User deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }
      next(error);
    }
  }

  static async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req.params.id as string) === (req as any).user.id) {
        return sendError(res, 'BAD_REQUEST', 'Cannot suspend your own account', 400);
      }
      await UsersService.suspendUser((req.params.id as string));
      return sendSuccess(res, { message: 'User suspended' });
    } catch (error) {
      next(error);
    }
  }

  static async unsuspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.unsuspendUser((req.params.id as string));
      return sendSuccess(res, { message: 'User unsuspended' });
    } catch (error) {
      next(error);
    }
  }

  static async forceLogout(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.forceLogout((req.params.id as string));
      return sendSuccess(res, { message: 'User forced logged out' });
    } catch (error) {
      next(error);
    }
  }

  static async getEffectivePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const perms = await PermissionsService.getEffectivePermissions((req.params.id as string));
      return sendSuccess(res, perms);
    } catch (error) {
      next(error);
    }
  }
}
