import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { env } from '../config/env';
import { AuditService } from '../services/audit.service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!email || !password) {
        return sendError(res, 'VALIDATION_ERROR', 'Email and password are required');
      }

      const { user, accessToken, refreshToken } = await AuthService.login(email, password, ipAddress, userAgent);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log the login action
      await AuditService.log('LOGIN', 'User', user.id, user.id, { userAgent }, req);

      return sendSuccess(res, { user, accessToken });
    } catch (error: any) {
      if (error.message === 'ACCOUNT_LOCKED') {
        return sendError(res, 'ACCOUNT_LOCKED', 'Too many failed attempts. Try again in 15 minutes.', 429);
      }
      if (error.message === 'INVALID_CREDENTIALS') {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!refreshToken) {
        return sendError(res, 'NO_REFRESH_TOKEN', 'No refresh token provided', 401);
      }

      const tokens = await AuthService.refreshTokens(refreshToken, ipAddress, userAgent);

      // Set new refresh token in cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, { accessToken: tokens.accessToken });
    } catch (error: any) {
      // If refresh fails, clear the cookie
      res.clearCookie('refreshToken');
      
      if (error.message === 'REUSE_DETECTED') {
        return sendError(res, 'SESSION_TERMINATED', 'Security alert: Session terminated due to suspicious activity', 403);
      }
      if (error.message === 'USER_INACTIVE') {
        return sendError(res, 'USER_INACTIVE', 'Account is suspended or deleted', 403);
      }
      return sendError(res, 'INVALID_TOKEN', 'Session expired or invalid', 401);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    // req.user will be populated by the authenticate middleware
    return sendSuccess(res, { user: (req as any).user });
  }
}
