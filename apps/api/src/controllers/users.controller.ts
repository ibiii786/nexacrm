import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { PermissionsService } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { AuditService } from '../services/audit.service';

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
      const requestingUser = (req as any).user;
      const createdBy = requestingUser.id;
      const createdByRole = requestingUser.role;
      // Map 'password' from request body to 'passwordPlain' expected by service
      const { password, ...rest } = req.body;
      const user = await UsersService.createUser({ ...rest, passwordPlain: password, createdBy, createdByRole });
      return sendSuccess(res, user, undefined, 201);
    } catch (error: any) {
      if (error.code === 'FORBIDDEN_ROLE_ESCALATION') {
        return sendError(res, 'FORBIDDEN_ROLE_ESCALATION', error.message, 403);
      }
      if (error.code === 'P2002') {
        return sendError(res, 'CONFLICT', 'Email already in use', 409);
      }
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUser = (req as any).user;
      const targetUserId = req.params.id as string;

      // Fetch target user to check their current role
      const targetUser = await UsersService.getUserById(targetUserId);
      if (!targetUser) {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }

      // Role escalation guard
      if (requestingUser.role !== 'SUPER_ADMIN') {
        if (targetUser.role === 'SUPER_ADMIN') {
          return sendError(res, 'FORBIDDEN', 'Only a Super Admin can modify another Super Admin', 403);
        }
        if (req.body.role && (req.body.role === 'ADMIN' || req.body.role === 'SUPER_ADMIN')) {
          return sendError(res, 'FORBIDDEN_ROLE_ESCALATION', 'Only a Super Admin can grant Admin roles', 403);
        }
      }

      const user = await UsersService.updateUser(targetUserId, req.body);
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
      // Prevent deleting self
      if ((req.params.id as string) === (req as any).user.id) {
        return sendError(res, 'BAD_REQUEST', 'Cannot delete your own account', 400);
      }

      const targetUser = await UsersService.getUserById(req.params.id as string);
      if (targetUser?.role === 'SUPER_ADMIN' && (req as any).user.role !== 'SUPER_ADMIN') {
        return sendError(res, 'FORBIDDEN', 'Only a Super Admin can delete another Super Admin', 403);
      }

      await UsersService.deleteUser((req.params.id as string), (req as any).user.role);
      
      await AuditService.log('DELETE_USER', 'User', (req.params.id as string), (req as any).user.id, null, req);

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
      
      const targetUser = await UsersService.getUserById(req.params.id as string);
      if (targetUser?.role === 'SUPER_ADMIN' && (req as any).user.role !== 'SUPER_ADMIN') {
        return sendError(res, 'FORBIDDEN', 'Only a Super Admin can suspend another Super Admin', 403);
      }
      
      await UsersService.suspendUser((req.params.id as string));
      return sendSuccess(res, { message: 'User suspended' });
    } catch (error) {
      next(error);
    }
  }

  static async unsuspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUser = await UsersService.getUserById(req.params.id as string);
      if (targetUser?.role === 'SUPER_ADMIN' && (req as any).user.role !== 'SUPER_ADMIN') {
        return sendError(res, 'FORBIDDEN', 'Only a Super Admin can unsuspend another Super Admin', 403);
      }

      await UsersService.unsuspendUser((req.params.id as string));
      return sendSuccess(res, { message: 'User unsuspended' });
    } catch (error) {
      next(error);
    }
  }

  static async forceLogout(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUser = await UsersService.getUserById(req.params.id as string);
      if (targetUser?.role === 'SUPER_ADMIN' && (req as any).user.role !== 'SUPER_ADMIN') {
        return sendError(res, 'FORBIDDEN', 'Only a Super Admin can force logout another Super Admin', 403);
      }

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

  static async grantPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId, expiresAt } = req.body;
      const grantedBy = (req as any).user.id;
      const result = await UsersService.grantPermission(req.params.id as string, permissionId, grantedBy, expiresAt);
      return sendSuccess(res, result);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return sendError(res, 'CONFLICT', 'Permission already granted', 409);
      }
      next(error);
    }
  }
  static async revokePermission(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.revokePermission(req.params.id as string, req.params.permissionId as string);
      return sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUser = (req as any).user;
      const targetId = req.params.id as string;
      // Only allow users to change their own password, or admins to change anyone's
      if (requestingUser.id !== targetId && requestingUser.role === 'USER') {
        return sendError(res, 'FORBIDDEN', 'You can only change your own password', 403);
      }
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        return sendError(res, 'VALIDATION_ERROR', 'New password must be at least 8 characters', 400);
      }
      // If changing own password, verify current password first
      if (requestingUser.id === targetId) {
        const valid = await UsersService.verifyPassword(targetId, currentPassword);
        if (!valid) {
          return sendError(res, 'INVALID_CREDENTIALS', 'Current password is incorrect', 401);
        }
      }
      await UsersService.changePassword(targetId, newPassword);
      return sendSuccess(res, { message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
