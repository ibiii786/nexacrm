import { PrismaClient } from '@prisma/client';
import { parsePasteText } from './src/utils/pasteParser';

const prisma = new PrismaClient();

async function main() {
  const fields = await prisma.field.findMany({ where: { isVisible: true } });
  const text = 'Total = 200$';
  const result = parsePasteText(text, fields);
  console.log('Result:', JSON.stringify(result, null, 2));
}

main();
