import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelpers';
import { logger } from '../config/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    ip: req.ip || req.socket.remoteAddress,
    user: (req as any).user?.id,
  });

  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific known errors
  if (err.name === 'SyntaxError') {
    return sendError(res, 'BAD_REQUEST', 'Invalid JSON payload', 400);
  }

  // Fallback to generic 500
  return sendError(res, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
}
