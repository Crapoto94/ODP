const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function read() {
  const g = await prisma.gabarit.findFirst({ where: { isDefault: true } });
  if (g) {
    console.log(JSON.stringify(JSON.parse(g.contenu), null, 2));
  } else {
    console.log('No default gabarit found');
  }
}

read().finally(() => prisma.$disconnect());
