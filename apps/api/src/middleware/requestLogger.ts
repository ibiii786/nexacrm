import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Wait for request to finish to log status code and response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.socket.remoteAddress;
    const user = (req as any).user?.id || 'unauthenticated';

    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      ip,
      user,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
