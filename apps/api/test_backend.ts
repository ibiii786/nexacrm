import { PrismaClient } from '@prisma/client';
import { OrdersService } from './src/services/orders.service';

const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst();
  let status = await prisma.status.findFirst({ where: { name: 'CustomStatus' } });
  
  // Attach orderStatus
  let osField = await prisma.field.findFirst({ where: { name: 'orderStatus' } });
  if (osField) {
    await prisma.statusField.upsert({
      where: { statusId_fieldId: { statusId: status.id, fieldId: osField.id } },
      update: {},
      create: { statusId: status.id, fieldId: osField.id }
    });
  }

  // Create order via service
  try {
    const order = await OrdersService.createOrder({
      statusId: status.id,
      deliveryDate: new Date(),
      customFields: { customerName: 'Test Backend' },
      notes: 'Some notes',
      createdBy: admin.id
    });
    console.log("Order created successfully!", order.id);
  } catch (err) {
    console.error("Order creation failed:", err.message);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
