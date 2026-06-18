import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import prisma from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';

export interface TokenPayload {
  userId: string;
  role: string;
}

export class AuthService {
  // Generate Access Token (15m expiry)
  static generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });
  }

  // Generate Refresh Token (7d expiry)
  static async generateRefreshToken(userId: string, familyId: string, ipAddress?: string, userAgent?: string) {
    const tokenId = uuidv4();
    
    // Create token payload
    const token = jwt.sign({ tokenId, familyId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    });

    // Hash the token for storage to prevent DB compromise from leaking active refresh tokens
    const tokenHash = await argon2.hash(token);

    // Calculate exact expiry date (7 days from now, or based on env config)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days if parsing env fails

    await prisma.session.create({
      data: {
        id: tokenId,
        userId,
        tokenHash,
        familyId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return token;
  }

  // Revoke all sessions for a user (Force Logout)
  static async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    
    // Also clear permission cache
    await redis.del(`user:${userId}:permissions`);
  }

  // Login
  static async login(email: string, passwordPlain: string, ipAddress?: string, userAgent?: string) {
    const lockoutKey = `lockout:${email}`;
    const attempts = await redis.get(lockoutKey);
    
    if (attempts && parseInt(attempts, 10) >= 5) {
      throw new Error('ACCOUNT_LOCKED');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive || user.deletedAt) {
      await this.incrementLoginAttempts(email);
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, passwordPlain);

    if (!isValidPassword) {
      await this.incrementLoginAttempts(email);
      throw new Error('INVALID_CREDENTIALS');
    }

    // Clear lockout on success
    await redis.del(lockoutKey);

    // Update last login (Section 12, Point 16 tracking)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        previousLogin: user.lastLogin,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const familyId = uuidv4();
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.generateRefreshToken(user.id, familyId, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        previousLoginAt: user.lastLogin,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh Token Rotation with Reuse Detection
  static async refreshTokens(refreshTokenStr: string, ipAddress?: string, userAgent?: string) {
    let payload: any;
    try {
      payload = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new Error('INVALID_TOKEN');
    }

    const { tokenId, familyId } = payload;

    const session = await prisma.session.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });

    if (!session) {
      throw new Error('INVALID_TOKEN');
    }

    // Reuse detection
    if (session.revokedAt) {
      logger.warn(`Refresh token reuse detected for family ${familyId}. Revoking all sessions.`);
      await prisma.session.updateMany({
        where: { familyId },
        data: { revokedAt: new Date() },
      });
      throw new Error('REUSE_DETECTED');
    }

    if (!session.user.isActive || session.user.deletedAt) {
      throw new Error('USER_INACTIVE');
    }

    // Verify hash matches
    const isValid = await argon2.verify(session.tokenHash, refreshTokenStr);
    if (!isValid) {
      throw new Error('INVALID_TOKEN');
    }

    // Revoke the used token (Rotation)
    await prisma.session.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const accessToken = this.generateAccessToken(session.userId, session.user.role);
    const newRefreshToken = await this.generateRefreshToken(session.userId, familyId, ipAddress, userAgent);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // Logout
  static async logout(refreshTokenStr: string) {
    try {
      const payload: any = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET);
      const { tokenId } = payload;
      
      await prisma.session.update({
        where: { id: tokenId },
        data: { revokedAt: new Date() },
      });
    } catch (err) {
      // If token is invalid/expired, ignore and just proceed with logout
    }
  }

  private static async incrementLoginAttempts(email: string) {
    const key = `lockout:${email}`;
    const current = await redis.incr(key);
    if (current === 1) {
      // 15 minute lockout window
      await redis.expire(key, 900);
    }
  }
}
