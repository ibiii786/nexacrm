import { PermissionsService } from '../../services/permissions.service';
import prisma from '../../config/database';
import redis from '../../config/redis';

jest.mock('../../config/database', () => ({
  userPolicy: {
    findMany: jest.fn(),
  },
  groupMember: {
    findMany: jest.fn(),
  },
  groupPolicy: {
    findMany: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
}));

describe('PermissionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEffectivePermissions', () => {
    it('should return permissions from cache if available', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(['ORDERS_VIEW']));

      const perms = await PermissionsService.getEffectivePermissions('user1');

      expect(perms).toEqual(['ORDERS_VIEW']);
      expect(prisma.userPolicy.findMany).not.toHaveBeenCalled();
    });

    it('should compute permissions from DB if not in cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      // Direct policy
      (prisma.userPolicy.findMany as jest.Mock).mockResolvedValue([
        {
          policy: {
            permissions: [
              { permission: { name: 'ORDERS_VIEW' } },
            ],
          },
        },
      ]);

      // Group policy
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
        {
          group: {
            policies: [
              {
                policy: {
                  permissions: [
                    { permission: { name: 'USERS_VIEW' } },
                  ],
                },
              },
            ],
          },
        },
      ]);

      const perms = await PermissionsService.getEffectivePermissions('user2');

      expect(perms).toContain('ORDERS_VIEW');
      expect(perms).toContain('USERS_VIEW');
      expect(redis.setex).toHaveBeenCalledWith('user:user2:permissions', 300, JSON.stringify(['ORDERS_VIEW', 'USERS_VIEW']));
    });
  });

  describe('Invalidation', () => {
    it('should invalidate user cache', async () => {
      await PermissionsService.invalidateUserCache('user1');
      expect(redis.del).toHaveBeenCalledWith('user:user1:permissions');
    });

    it('should invalidate group cache', async () => {
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
      await PermissionsService.invalidateGroupCache('group1');
      expect(redis.del).toHaveBeenCalledWith('user:u1:permissions', 'user:u2:permissions');
    });
  });
});
