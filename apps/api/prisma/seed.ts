import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { env } from '../src/config/env';
import {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_MODULES,
  DEFAULT_STATUSES,
  STANDARD_FIELDS,
  DEFAULT_SETTINGS,
  DEFAULT_USER_PERMISSIONS,
} from '@nexacrm/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Settings (idempotent upsert)
  console.log('Seeding settings...');
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // 2. Super Admin User (idempotent)
  console.log('Seeding SUPER_ADMIN...');
  const superAdminEmail = env.SUPER_ADMIN_EMAIL;
  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!superAdmin) {
    const passwordHash = await argon2.hash(env.SUPER_ADMIN_PASSWORD);
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: env.SUPER_ADMIN_NAME,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('Created new SUPER_ADMIN user.');
  } else {
    console.log('SUPER_ADMIN already exists.');
  }

  // Add a standard USER for testing
  let testUser = await prisma.user.findUnique({ where: { email: 'user@nexacrm.com' } });
  if (!testUser) {
    const userPass = await argon2.hash('UserPassword123!');
    testUser = await prisma.user.create({
      data: {
        email: 'user@nexacrm.com',
        name: 'Standard User',
        passwordHash: userPass,
        role: 'USER',
        isActive: true,
      },
    });
    console.log('Created standard test user.');
  }

  // Add an ADMIN for testing
  let adminUser = await prisma.user.findUnique({ where: { email: 'manager@nexacrm.com' } });
  if (!adminUser) {
    const adminPass = await argon2.hash('AdminPassword123!');
    adminUser = await prisma.user.create({
      data: {
        email: 'manager@nexacrm.com',
        name: 'Admin User',
        passwordHash: adminPass,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Created admin test user.');
  }

  // 3. Permissions (idempotent upsert)
  console.log('Seeding permissions...');
  for (const permName of ALL_PERMISSIONS) {
    // Find which module this permission belongs to
    let moduleName = 'Other';
    for (const [mod, perms] of Object.entries(PERMISSION_MODULES)) {
      if (perms.includes(permName)) {
        moduleName = mod;
        break;
      }
    }

    await prisma.permission.upsert({
      where: { name: permName },
      update: {
        description: PERMISSION_DESCRIPTIONS[permName],
        module: moduleName,
      },
      create: {
        id: crypto.randomUUID(),
        name: permName,
        description: PERMISSION_DESCRIPTIONS[permName],
        module: moduleName,
      },
    });
  }

  console.log('Granting permissions to test users...');
  
  const allPerms = await prisma.permission.findMany();
  
  if (testUser) {
    const defaultPerms = allPerms.filter(p => DEFAULT_USER_PERMISSIONS.includes(p.name as any));
    for (const p of defaultPerms) {
      const existing = await prisma.userPermission.findFirst({ where: { userId: testUser.id, permissionId: p.id } });
      if (!existing) {
        await prisma.userPermission.create({ data: { userId: testUser.id, permissionId: p.id } });
      }
    }
  }

  if (adminUser) {
    for (const p of allPerms) {
      const existing = await prisma.userPermission.findFirst({ where: { userId: adminUser.id, permissionId: p.id } });
      if (!existing) {
        await prisma.userPermission.create({ data: { userId: adminUser.id, permissionId: p.id } });
      }
    }
  }


  // 4. Default Statuses (idempotent)
  console.log('Seeding default statuses...');
  // We don't have a unique constraint on status name, so we check first by name
  for (const status of DEFAULT_STATUSES) {
    const existing = await prisma.status.findFirst({
      where: { name: status.name, deletedAt: null },
    });

    if (existing) {
      if (existing.isDefault !== status.isDefault || existing.position !== status.position) {
        await prisma.status.update({
          where: { id: existing.id },
          data: { isDefault: status.isDefault, position: status.position },
        });
      }
    } else {
      await prisma.status.create({
        data: {
          name: status.name,
          color: status.color,
          icon: status.icon,
          position: status.position,
          isDefault: status.isDefault,
          createdBy: superAdmin.id,
        },
      });
    }
  }

  // 5. Standard Fields (idempotent)
  console.log('Seeding standard fields...');
  // We don't have a unique constraint on field name, check first
  for (const field of STANDARD_FIELDS) {
    const existing = await prisma.field.findFirst({
      where: { name: field.name },
    });

    // createdBy is strictly internal-only metadata about who entered the record.
    // It must never be shared externally with customers when copying order details.
    const isCopyable = field.name !== 'createdBy';

    if (existing) {
      if (existing.isCopyable !== isCopyable) {
        await prisma.field.update({
          where: { id: existing.id },
          data: { isCopyable, copyPosition: field.position },
        });
      }
    } else {
      await prisma.field.create({
        data: {
          name: field.name,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          isVisible: true,
          isGlobal: true,
          position: field.position,
          isCopyable: isCopyable,
          copyPosition: field.position,
          addedBy: superAdmin.id,
          options: field.options || null,
        },
      });
    }
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
