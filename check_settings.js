const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const settings = await prisma.$queryRaw`SELECT * FROM AppSettings WHERE id = 1`;
    console.log(JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
