const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:C:/dev/ODP/prisma/prisma/dev.db'
    }
  }
});

async function main() {
  const users = await prisma.user.count();
  const occupations = await prisma.occupation.count();
  const tiers = await prisma.tiers.count();
  console.log('--- OLD DATABASE STATUS ---');
  console.log('Users:', users);
  console.log('Occupations:', occupations);
  console.log('Tiers:', tiers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
