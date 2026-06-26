import { Request, Response, NextFunction } from 'express';

export const redisCache = (ttlSeconds = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
