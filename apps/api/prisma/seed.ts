import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../src/config/env';
import {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_MODULES,
  DEFAULT_STATUSES,
  STANDARD_FIELDS,
  DEFAULT_SETTINGS,
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
        id: uuidv4(),
        name: permName,
        description: PERMISSION_DESCRIPTIONS[permName],
        module: moduleName,
      },
    });
  }

  // 4. Default Statuses (idempotent)
  console.log('Seeding default statuses...');
  // We don't have a unique constraint on status name, so we check first
  for (const status of DEFAULT_STATUSES) {
    const existing = await prisma.status.findFirst({
      where: { name: status.name, isDefault: status.isDefault },
    });

    if (!existing) {
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

    if (!existing) {
      await prisma.field.create({
        data: {
          name: field.name,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          isVisible: true,
          isGlobal: true,
          position: field.position,
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
