import { Request, Response, NextFunction } from 'express';
import { GroupsService } from '../services/groups.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class GroupsController {
  static async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await GroupsService.getGroups();
      return sendSuccess(res, groups);
    } catch (error) {
      next(error);
    }
  }

  static async getGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await GroupsService.getGroupById((req.params.id as string));
      if (!group) {
        return sendError(res, 'NOT_FOUND', 'Group not found', 404);
      }
      return sendSuccess(res, group);
    } catch (error) {
      next(error);
    }
  }

  static async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user.id;
      const { name, description } = req.body;

      if (!name) {
        return sendError(res, 'VALIDATION_ERROR', 'Name is required');
      }

      const group = await GroupsService.createGroup({ name, description, createdBy });
      return sendSuccess(res, group, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await GroupsService.updateGroup((req.params.id as string), req.body);
      return sendSuccess(res, group);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'Group not found', 404);
      }
      next(error);
    }
  }

  static async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.deleteGroup((req.params.id as string));
      return sendSuccess(res, { message: 'Group deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'Group not found', 404);
      }
      next(error);
    }
  }

  // Members
  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      const addedBy = (req as any).user.id;
      if (!userId) return sendError(res, 'VALIDATION_ERROR', 'userId is required');

      await GroupsService.addMember((req.params.id as string), userId, addedBy);
      return sendSuccess(res, { message: 'Member added' }, undefined, 201);
    } catch (error: any) {
      if (error.code === 'P2002') return sendError(res, 'CONFLICT', 'User already in group', 409);
      if (error.code === 'P2025' || error.code === 'P2003') return sendError(res, 'NOT_FOUND', 'Group or User not found', 404);
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.removeMember((req.params.id as string), (req.params.userId as string));
      return sendSuccess(res, { message: 'Member removed' });
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Member not found in group', 404);
      next(error);
    }
  }

  // Permissions
  static async attachPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId } = req.body;
      if (!permissionId) return sendError(res, 'VALIDATION_ERROR', 'permissionId is required');

      await GroupsService.attachPermission((req.params.id as string), permissionId);
      return sendSuccess(res, { message: 'Permission attached to group' }, undefined, 201);
    } catch (error: any) {
      if (error.code === 'P2002') return sendError(res, 'CONFLICT', 'Permission already attached', 409);
      if (error.code === 'P2025' || error.code === 'P2003') return sendError(res, 'NOT_FOUND', 'Group or Permission not found', 404);
      next(error);
    }
  }

  static async detachPermission(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.detachPermission((req.params.id as string), (req.params.permissionId as string));
      return sendSuccess(res, { message: 'Permission detached' });
    } catch (error: any) {
      if (error.code === 'P2025') return sendError(res, 'NOT_FOUND', 'Permission not attached to group', 404);
      next(error);
    }
  }
}
