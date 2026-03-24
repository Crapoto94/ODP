import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.article.findMany({
    where: { designation: { contains: 'chantier' } },
    include: { modeTaxation: true }
  })
  console.log(JSON.stringify(articles, null, 2))
  
  const modes = await prisma.modeTaxation.findMany()
  console.log(JSON.stringify(modes, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
