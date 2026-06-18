import prisma from '../config/database';
import { PermissionsService } from './permissions.service';

export class PoliciesService {
  static async getPolicies() {
    return prisma.policy.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true,
            groups: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getPolicyById(id: string) {
    return prisma.policy.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  static async createPolicy(data: { name: string; description?: string; permissionIds: string[]; createdBy?: string }) {
    return prisma.policy.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        permissions: {
          create: data.permissionIds.map(permissionId => ({
            permissionId
          }))
        }
      },
      include: {
        permissions: true
      }
    });
  }

  static async updatePolicy(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    // If permissions are updated, we need to rebuild the relations and invalidate cache
    if (data.permissionIds) {
      const updated = await prisma.$transaction(async (tx) => {
        // Clear existing
        await tx.policyPermission.deleteMany({
          where: { policyId: id }
        });

        // Add new
        return tx.policy.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            permissions: {
              create: data.permissionIds!.map(permissionId => ({
                permissionId
              }))
            }
          },
          include: {
            permissions: true
          }
        });
      });

      // Crucial: Invalidate cache for everyone using this policy
      await PermissionsService.invalidatePolicyCache(id);

      return updated;
    }

    return prisma.policy.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  static async deletePolicy(id: string) {
    // Get policy to invalidate cache before deleting
    await PermissionsService.invalidatePolicyCache(id);

    return prisma.policy.delete({
      where: { id }
    });
  }
}
