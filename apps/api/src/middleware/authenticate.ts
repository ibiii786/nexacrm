import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { sendError } from '../utils/responseHelpers';
import { TokenPayload } from '../services/auth.service';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'UNAUTHORIZED', 'Missing or invalid authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (err) {
      return sendError(res, 'UNAUTHORIZED', 'Token expired or invalid', 401);
    }

    // Load user (ensure active and not soft-deleted)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return sendError(res, 'USER_INACTIVE', 'Account is suspended or deleted', 403);
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    next(error);
  }
}
