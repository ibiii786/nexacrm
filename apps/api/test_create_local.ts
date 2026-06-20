import { UsersService } from './src/services/users.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!admin) {
      console.log('No super admin found');
      return;
    }

    const user = await UsersService.createUser({
      name: 'Test Local',
      email: 'test_local_' + Math.random() + '@nexacrm.com',
      passwordPlain: 'Password123!',
      role: 'USER',
      createdBy: admin.id
    });
    console.log('Success:', user);
  } catch (err) {
    console.error('Error Details:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
