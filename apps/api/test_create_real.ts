import { env } from './src/config/env';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('No super admin found');
    return;
  }
  
  const token = jwt.sign({ userId: admin.id, email: admin.email, role: admin.role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  const res = await fetch('http://localhost:3001/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test User', email: 'test_create_real_' + Math.random() + '@nexacrm.com', password: 'Password123!', role: 'USER' })
  });
  
  const data = await res.json();
  console.log(res.status, JSON.stringify(data, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
