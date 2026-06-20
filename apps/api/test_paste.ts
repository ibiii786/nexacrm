import { PrismaClient } from '@prisma/client';
import { parsePasteText } from './src/utils/pasteParser';

const prisma = new PrismaClient();

async function main() {
  const fields = await prisma.field.findMany({ where: { isVisible: true } });
  const text = 'Total is added = 200$\nContact = 1234567890';
  const result = parsePasteText(text, fields);
  console.log(JSON.stringify(result, null, 2));
}

main();
