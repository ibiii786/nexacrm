import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const admin = await prisma.user.findFirst();
  let status = await prisma.status.findFirst({ where: { name: 'CustomStatus' } });
  if (!status) {
    status = await prisma.status.create({
      data: {
        name: 'CustomStatus',
        color: '#ff00ff',
        position: 99,
        isDefault: false,
        createdBy: admin?.id,
      }
    });
  }
  let field = await prisma.field.findFirst({ where: { name: 'customerName' } });
  if (!field) {
    field = await prisma.field.create({
      data: {
        name: 'customerName',
        label: 'Customer Name',
        type: 'TEXT',
        position: 1,
        addedBy: admin?.id
      }
    });
  }
  await prisma.statusField.upsert({
    where: { statusId_fieldId: { statusId: status.id, fieldId: field.id } },
    update: {},
    create: { statusId: status.id, fieldId: field.id }
  });
  console.log("Attached customerName to CustomStatus");
}
run().catch(console.error).finally(() => prisma.$disconnect());
