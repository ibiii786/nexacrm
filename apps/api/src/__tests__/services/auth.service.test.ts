import { AuthService } from '../../services/auth.service';
import prisma from '../../config/database';
import redis from '../../config/redis';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

jest.mock('../../config/database', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  session: {
    create: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
}));

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw ACCOUNT_LOCKED if more than 5 attempts', async () => {
      (redis.get as jest.Mock).mockResolvedValue('5');

      await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow('ACCOUNT_LOCKED');
    });

    it('should throw INVALID_CREDENTIALS if user not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow('INVALID_CREDENTIALS');
      expect(redis.incr).toHaveBeenCalledWith('lockout:test@example.com');
    });

    it('should throw INVALID_CREDENTIALS if password invalid', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', isActive: true, passwordHash: 'hash' });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow('INVALID_CREDENTIALS');
      expect(redis.incr).toHaveBeenCalledWith('lockout:test@example.com');
    });

    it('should return tokens on successful login', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER',
        isActive: true,
        passwordHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');
      (argon2.hash as jest.Mock).mockResolvedValue('tokenHash');

      const result = await AuthService.login('test@example.com', 'password');

      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toBe('token');
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '1' } }));
      expect(redis.del).toHaveBeenCalledWith('lockout:test@example.com');
    });
  });

  describe('refreshTokens', () => {
    it('should detect reuse and revoke all sessions', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ tokenId: '1', familyId: 'f1' });
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        familyId: 'f1',
        revokedAt: new Date(),
        user: { isActive: true },
      });

      await expect(AuthService.refreshTokens('oldToken')).rejects.toThrow('REUSE_DETECTED');
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'f1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should successfully rotate tokens', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ tokenId: '1', familyId: 'f1' });
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        familyId: 'f1',
        userId: 'u1',
        tokenHash: 'hash',
        user: { isActive: true, role: 'USER' },
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('newToken');

      const result = await AuthService.refreshTokens('validToken');

      expect(result.accessToken).toBe('newToken');
      expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '1' } }));
    });
  });
});
