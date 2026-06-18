import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/responseHelpers';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and replace req.body with the validated and typed data
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors nicely
        const details = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        
        return sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400, details);
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'VALIDATION_ERROR', 'Invalid request query parameters', 400, details);
      }
      next(error);
    }
  };
}
