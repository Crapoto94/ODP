const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- DB STATUS MIGRATION ---');
  
  const mapping = {
    'DECLARED': 'EN_ATTENTE',
    'VERIFIED': 'VERIFIE',
    'VALIDE': 'VERIFIE',
    'INVOICED': 'FACTURE',
    'PAID': 'PAYE',
    'COMPLETED': 'TERMINE',
    'IN_PROGRESS': 'EN_COURS'
  };

  for (const [oldStatut, newStatut] of Object.entries(mapping)) {
    const updated = await prisma.occupation.updateMany({
      where: { statut: oldStatut },
      data: { statut: newStatut }
    });
    if (updated.count > 0) {
      console.log(`Migrated ${updated.count} records from ${oldStatut} to ${newStatut}`);
    }
  }

  console.log('Migration complete.');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
