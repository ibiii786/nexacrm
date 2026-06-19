import prisma from '../config/database';
import { PermissionsService } from './permissions.service';

export class GroupsService {
  static async getGroups() {
    return prisma.group.findMany({
      include: {
        _count: {
          select: {
            members: true,
            permissions: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getGroupById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  }

  static async createGroup(data: { name: string; description?: string; createdBy?: string }) {
    return prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
      }
    });
  }

  static async updateGroup(id: string, data: { name?: string; description?: string }) {
    return prisma.group.update({
      where: { id },
      data
    });
  }

  static async deleteGroup(id: string) {
    // Invalidate members before deleting
    await PermissionsService.invalidateGroupCache(id);
    return prisma.group.delete({
      where: { id }
    });
  }

  // Members
  static async addMember(groupId: string, userId: string, addedBy?: string) {
    const res = await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        addedBy
      }
    });
    await PermissionsService.invalidateUserCache(userId);
    return res;
  }

  static async removeMember(groupId: string, userId: string) {
    const res = await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });
    await PermissionsService.invalidateUserCache(userId);
    return res;
  }

  // Permissions
  static async attachPermission(groupId: string, permissionId: string) {
    const res = await prisma.groupPermission.create({
      data: {
        groupId,
        permissionId
      }
    });
    // Permission added to group affects all members
    await PermissionsService.invalidateGroupCache(groupId);
    return res;
  }

  static async detachPermission(groupId: string, permissionId: string) {
    const res = await prisma.groupPermission.delete({
      where: {
        groupId_permissionId: {
          groupId,
          permissionId
        }
      }
    });
    await PermissionsService.invalidateGroupCache(groupId);
    return res;
  }
}
