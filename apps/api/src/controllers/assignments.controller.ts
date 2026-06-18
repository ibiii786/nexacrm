import { Request, Response, NextFunction } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';

export class AssignmentsController {
  static async assignPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId, expiresAt } = req.body;
      const { userId } = req.params;
      const grantedBy = (req as any).user.id;

      if (!policyId) {
        return sendError(res, 'VALIDATION_ERROR', 'policyId is required');
      }

      const assignment = await AssignmentsService.assignPolicyToUser(
        userId,
        policyId,
        grantedBy,
        expiresAt ? new Date(expiresAt) : undefined
      );

      return sendSuccess(res, assignment, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  static async revokeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = req.params;
      await AssignmentsService.revokePolicyAssignment(assignmentId);
      return sendSuccess(res, { message: 'Assignment revoked' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return sendError(res, 'NOT_FOUND', 'Assignment not found', 404);
      }
      next(error);
    }
  }

  static async getUserAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await AssignmentsService.getUserAssignments(req.params.userId);
      return sendSuccess(res, assignments);
    } catch (error) {
      next(error);
    }
  }
}
