const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = parseInt(process.argv[2]);
  if (!id) {
    console.error('Please provide a dossier ID');
    process.exit(1);
  }

  const occ = await prisma.occupation.findUnique({
    where: { id },
    include: {
      lignes: { include: { article: true } }
    }
  });

  if (!occ) {
    console.log('Occupation not found');
  } else {
    console.log('--- OCCUPATION ---');
    console.log(`ID: ${occ.id}`);
    console.log(`Type: ${occ.type}`);
    console.log(`Annee Taxation: ${occ.anneeTaxation}`);
    console.log(`Surface Enseignes: ${occ.lignes.filter(l => l.article?.meta?.tlpeType === 'ENSEIGNE').reduce((acc, l) => acc + (l.quantite1 || 0), 0)} m²`);
    
    const year = occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear());
    const config = await prisma.tlpeConfig.findUnique({ where: { annee: year } });
    console.log('--- CONFIG ---');
    if (config) {
      console.log(`Seuil exonération: ${config.exoneration} m²`);
    } else {
      console.log('Config not found for year', year);
    }
  }
  await prisma.$disconnect();
}

main();
