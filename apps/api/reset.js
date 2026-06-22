const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.emoehghvzxulvzocxykn:nexacrm@786@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function main() {
  const emailsToDelete = ['user@nexacrm.com', 'manager@nexacrm.com', 'test@nexacrm.com'];
  
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: emailsToDelete
      }
    }
  });
  
  console.log(`Deleted ${result.count} test users.`);
}

main().finally(() => prisma.$disconnect());
