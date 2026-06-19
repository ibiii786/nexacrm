import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export const redisCache = (ttlSeconds = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    // Cache key structure: e.g. cache:api:dashboard:admin:user123
    const cacheKey = `cache:${req.originalUrl || req.url}:${userId}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for ${cacheKey}`);
        const parsed = JSON.parse(cachedData);
        return res.status(200).json(parsed);
      }
    } catch (err) {
      logger.error(`Redis cache get error for ${cacheKey}:`, err);
    }

    // Intercept res.json to cache the response body
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          redis.set(cacheKey, JSON.stringify(body), 'EX', ttlSeconds)
            .catch(err => logger.error(`Redis cache set error for ${cacheKey}:`, err));
        } catch (err) {
          logger.error(`Failed to serialize cache for ${cacheKey}:`, err);
        }
      }
      return originalJson(body);
    };

    next();
  };
};
