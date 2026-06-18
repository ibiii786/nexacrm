import { Request, Response, NextFunction } from 'express';
import { PoliciesService } from '../services/policies.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class PoliciesController {
  static async getPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const policies = await PoliciesService.getPolicies();
      return sendSuccess(res, policies);
    } catch (error) {
      next(error);
    }
  }

  static async getPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await PoliciesService.getPolicyById((req.params.id as string));
      if (!policy) {
        return sendError(res, 'NOT_FOUND', 'Policy not found', 404);
      }
      return sendSuccess(res, policy);
    } catch (error) {
      next(error);
    }
  }

  static async createPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user.id;
      const { name, description, permissionIds } = req.body;

      if (!name || !permissionIds || !Array.isArray(permissionIds)) {
        return sendError(res, 'VALIDATION_ERROR', 'Name and an array of permissionIds are required');
      }

      const policy = await PoliciesService.createPolicy({
        name,
        description,
        permissionIds,
        createdBy
      });
      return sendSuccess(res, policy, undefined, 201);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return sendError(res, 'CONFLICT', 'Policy name already exists', 409);
      }
      next(error);
    }
  }

  static async updatePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await PoliciesService.updatePolicy((req.params.id as string), req.body);
      return sendSuccess(res, policy);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'Policy not found', 404);
      }
      next(error);
    }
  }

  static async deletePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      await PoliciesService.deletePolicy((req.params.id as string));
      return sendSuccess(res, { message: 'Policy deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'Policy not found', 404);
      }
      next(error);
    }
  }
}
