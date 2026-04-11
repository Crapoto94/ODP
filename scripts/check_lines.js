const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = parseInt(process.argv[2]);
  const occ = await prisma.occupation.findUnique({
    where: { id },
    include: {
      lignes: { include: { article: true } }
    }
  });

  if (!occ) return;
  
  console.log(`Dossier ${id} Type: ${occ.type}`);
  occ.lignes.forEach((l, i) => {
    console.log(`Ligne ${i+1}:`);
    console.log(` - Article: ${l.article?.designation}`);
    console.log(` - Type: ${l.article?.meta?.tlpeType}`);
    console.log(` - Quantité1 (Surface): ${l.quantite1}`);
    console.log(` - Métadonnées: ${JSON.stringify(l.article?.meta)}`);
  });
  
  await prisma.$disconnect();
}

main();
