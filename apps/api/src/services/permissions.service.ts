import prisma from '../config/database';

export class PermissionsService {
  /**
   * Resolves the effective permissions for a user.
   * Combines direct UserPermission assignments only (Groups/Policies removed).
   * No Redis cache — DB query is fast enough for small teams.
   */
  static async getEffectivePermissions(userId: string): Promise<string[]> {
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

    return directPermissions.map(up => up.permission.name);
  }

  /**
   * No-op: kept for call-site compatibility during migration.
   * Remove callers after Stage 5 (IAM cleanup).
   */
  static async invalidateUserCache(_userId: string): Promise<void> {
    // No Redis cache to invalidate
  }

  static async invalidateGroupCache(_groupId: string): Promise<void> {
    // No Redis cache to invalidate
  }

  static async invalidatePermissionCache(_permissionId: string): Promise<void> {
    // No Redis cache to invalidate
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
