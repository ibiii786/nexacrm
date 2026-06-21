
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function test() {
  const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const token = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET || 'change_me_to_64_char_random_string');

  const res = await fetch('http://localhost:3001/api/settings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Settings:', data);
  process.exit(0);
}
test();
