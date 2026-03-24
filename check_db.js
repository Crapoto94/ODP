const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const occupations = await prisma.occupation.count();
  const tiers = await prisma.tiers.count();
  console.log('--- DATABASE STATUS ---');
  console.log('Users:', users);
  console.log('Occupations:', occupations);
  console.log('Tiers:', tiers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
