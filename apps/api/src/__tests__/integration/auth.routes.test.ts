import request from 'supertest';
import app from '../../app';
import { AuthService } from '../../services/auth.service';

jest.mock('../../services/auth.service');
jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));
jest.mock('../../config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
  }
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 on invalid credentials', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and tokens on success', async () => {
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      
      // Refresh token should be in cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=refresh');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 if no refresh token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
    });

    it('should return 200 and new tokens on success', async () => {
      (AuthService.refreshTokens as jest.Mock).mockResolvedValue({
        accessToken: 'newAccess',
        refreshToken: 'newRefresh',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=oldRefresh']);

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBe('newAccess');
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('refreshToken=newRefresh');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return 200', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=validRefresh']);

      expect(response.status).toBe(200);
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('refreshToken=;'); // Cleared cookie
    });
  });
});
