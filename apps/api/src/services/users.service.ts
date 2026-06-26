import prisma from '../config/database';
import { AuthService } from './auth.service';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { settingsService } from './settings.service';
import { notificationsService } from './notifications.service';
import { DEFAULT_USER_PERMISSIONS } from '../shared';

export class UsersService {
  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            createdOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  static async createUser(data: { name: string; email: string; passwordPlain: string; role: Role; createdBy?: string; createdByRole?: string }) {
    // Role escalation guard: ADMINs can only create USERs, not other ADMINs or SUPER_ADMINs.
    // Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN accounts.
    if (data.createdByRole === 'ADMIN' && (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN')) {
      const err: any = new Error('Only a Super Admin can create Admin accounts');
      err.code = 'FORBIDDEN_ROLE_ESCALATION';
      throw err;
    }

    const passwordHash = await argon2.hash(data.passwordPlain);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        createdBy: data.createdBy
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    // Assign default permissions
    const allPerms = await prisma.permission.findMany();
    let permsToAssign: any[] = [];
    
    if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
      permsToAssign = allPerms;
    } else if (data.role === 'USER') {
      permsToAssign = allPerms.filter(p => DEFAULT_USER_PERMISSIONS.includes(p.name as any));
    }

    if (permsToAssign.length > 0) {
      await prisma.userPermission.createMany({
        data: permsToAssign.map(p => ({
          userId: user.id,
          permissionId: p.id,
          grantedBy: data.createdBy || user.id, // self if not provided
        }))
      });
    }

    return user;
  }

  static async updateUser(id: string, data: { name?: string; email?: string; role?: Role; passwordPlain?: string }) {
    const updateData: any = { ...data };
    
    if (updateData.passwordPlain) {
      updateData.passwordHash = await argon2.hash(updateData.passwordPlain);
      delete updateData.passwordPlain;
    }

    if (updateData.role) {
      await PermissionsService.invalidateUserCache(id);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    const sendEmail = (await settingsService.getSettingByKey('emailNotifyAccountModified', 'true')) === 'true';
    if (sendEmail) {
      notificationsService.createNotification({
        userId: id,
        type: 'ACCOUNT_MODIFIED',
        title: `Your account was updated`,
        body: `Your account details or role have been updated by an administrator.`,
        link: `/profile`,
        sendEmailNotification: true,
      }).catch(e => console.error(e));
    }

    return user;
  }

  static async suspendUser(id: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    
    // Suspending immediately revokes sessions
    await AuthService.revokeAllUserSessions(id);
    return user;
  }

  static async unsuspendUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  static async forceLogout(id: string) {
    await AuthService.revokeAllUserSessions(id);
  }

  static async deleteUser(id: string, deletedByRole?: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (targetUser) {
      if (targetUser.role === 'SUPER_ADMIN') {
        throw new Error('SUPER_ADMIN accounts cannot be deleted');
      }
      if (deletedByRole === 'ADMIN' && targetUser.role === 'ADMIN') {
        throw new Error('An ADMIN cannot delete another ADMIN account');
      }
    }

    // Soft delete via Prisma $extends configuration
    await prisma.user.delete({
      where: { id }
    });
    // Immediately log out
    await AuthService.revokeAllUserSessions(id);
  }

  static async grantPermission(userId: string, permissionId: string, grantedBy: string, expiresAt?: string) {
    const userPermission = await prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        grantedBy,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });
    await PermissionsService.invalidateUserCache(userId);
    return userPermission;
  }

  static async revokePermission(userId: string, permissionId: string) {
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId
      }
    });
    await PermissionsService.invalidateUserCache(userId);
  }
  static async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
    if (!user) return false;
    return argon2.verify(user.passwordHash, password);
  }

  static async changePassword(id: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);
    return prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }
}
