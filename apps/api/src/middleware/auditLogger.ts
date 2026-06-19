import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

/**
 * Middleware that automatically logs any mutating request (POST, PUT, DELETE, PATCH)
 * into the system_audit_log table, after the request completes successfully.
 */
export function systemAuditLogger(entityType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only log mutating methods
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
      return next();
    }

    const originalSend = res.json;
    let responseBody: any;

    // Intercept response to check if it was successful
    res.json = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      // Only log if the request was successful (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && responseBody?.success) {
        try {
          const user = (req as any).user;
          const ipAddress = req.ip || req.socket.remoteAddress || null;
          const userAgent = req.headers['user-agent'] || null;

          // Attempt to extract entity ID from route params or response
          const entityId = req.params.id || responseBody?.data?.id || null;

          await prisma.auditLog.create({
            data: {
              actorId: user?.id || null,
              action: req.method,
              entity: entityType,
              entityId,
              details: { diff: req.body, userAgent }, // The payload that was sent
              ipAddress,
            },
          });
        } catch (error) {
          logger.error('Failed to write system audit log', error);
        }
      }
    });

    next();
  };
}
