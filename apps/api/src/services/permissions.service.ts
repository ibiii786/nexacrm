import prisma from '../config/database';
import redis from '../config/redis';

export class PermissionsService {
  private static readonly CACHE_TTL = 300; // 5 minutes in seconds

  /**
   * Resolves the effective permissions for a user by combining:
   * 1. Permissions directly assigned to the user (UserPermission)
   * 2. Permissions assigned to groups the user belongs to (GroupPermission)
   * Caches the result in Redis.
   */
  static async getEffectivePermissions(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:permissions`;
    
    // 1. Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Not in cache, compute from DB
    
    // Get direct permissions
    const directPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true
      }
    });

    // Get group permissions
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Extract and flatten permission names
    const permissionSet = new Set<string>();

    // Add direct permissions
    for (const up of directPermissions) {
      permissionSet.add(up.permission.name);
    }

    // Add group permissions
    for (const membership of groupMemberships) {
      for (const gp of membership.group.permissions) {
        permissionSet.add(gp.permission.name);
      }
    }

    const effectivePermissions = Array.from(permissionSet);

    // 3. Save to cache
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(effectivePermissions));

    return effectivePermissions;
  }

  /**
   * Invalidates a single user's permission cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await redis.del(`user:${userId}:permissions`);
  }

  /**
   * Invalidates permission cache for all members of a group
   */
  static async invalidateGroupCache(groupId: string): Promise<void> {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true }
    });
    
    if (members.length > 0) {
      const keys = members.map(m => `user:${m.userId}:permissions`);
      await redis.del(...keys);
    }
  }

  /**
   * Invalidates permission cache for all users attached to a permission (directly or via group)
   */
  static async invalidatePermissionCache(permissionId: string): Promise<void> {
    // Users with direct permission
    const directUsers = await prisma.userPermission.findMany({
      where: { permissionId },
      select: { userId: true }
    });

    // Users with permission via group
    const groupPermissions = await prisma.groupPermission.findMany({
      where: { permissionId },
      select: { groupId: true }
    });
    
    const groupIds = groupPermissions.map(gp => gp.groupId);
    
    let groupUsers: { userId: string }[] = [];
    if (groupIds.length > 0) {
      groupUsers = await prisma.groupMember.findMany({
        where: { groupId: { in: groupIds } },
        select: { userId: true }
      });
    }

    // Combine and deduplicate
    const userIds = new Set([
      ...directUsers.map(u => u.userId),
      ...groupUsers.map(u => u.userId)
    ]);

    if (userIds.size > 0) {
      const keys = Array.from(userIds).map(id => `user:${id}:permissions`);
      await redis.del(...keys);
    }
  }

  static async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  }
}
