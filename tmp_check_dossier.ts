import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const dossier = await prisma.occupation.findUnique({
    where: { id: 11 }
  })
  console.log(JSON.stringify(dossier, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
