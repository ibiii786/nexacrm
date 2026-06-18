import prisma from '../config/database';
import redis from '../config/redis';

export class PermissionsService {
  private static readonly CACHE_TTL = 300; // 5 minutes in seconds

  /**
   * Resolves the effective permissions for a user by combining:
   * 1. Permissions from policies directly assigned to the user
   * 2. Permissions from policies assigned to groups the user belongs to
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
    
    // Get direct policies
    const directPolicies = await prisma.userPolicy.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        policy: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    // Get group policies
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            policies: {
              include: {
                policy: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Extract and flatten permission names
    const permissionSet = new Set<string>();

    // Add direct permissions
    for (const userPolicy of directPolicies) {
      for (const pp of userPolicy.policy.permissions) {
        permissionSet.add(pp.permission.name);
      }
    }

    // Add group permissions
    for (const membership of groupMemberships) {
      for (const gp of membership.group.policies) {
        for (const pp of gp.policy.permissions) {
          permissionSet.add(pp.permission.name);
        }
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
   * Invalidates permission cache for all users attached to a policy (directly or via group)
   */
  static async invalidatePolicyCache(policyId: string): Promise<void> {
    // Users with direct policy
    const directUsers = await prisma.userPolicy.findMany({
      where: { policyId },
      select: { userId: true }
    });

    // Users with policy via group
    const groupPolicies = await prisma.groupPolicy.findMany({
      where: { policyId },
      select: { groupId: true }
    });
    
    const groupIds = groupPolicies.map(gp => gp.groupId);
    
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
}
