import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  console.log(JSON.stringify(settings, null, 2));
}
run();
