import { prisma, initializePrisma } from '../lib/prisma';

async function cleanupPostgres() {
  console.log('🚀 Starting PostgreSQL data cleanup...');

  try {
    // Wait for dynamic initialization from SQLite
    await initializePrisma();

    // 1. Delete Occupations of specific types
    console.log('🗑️ Deleting CHANTIER, TOURNAGE and TLPE occupations...');
    const deletedOccupations = await prisma.occupation.deleteMany({
      where: {
        type: {
          in: ['CHANTIER', 'TOURNAGE', 'TLPE']
        }
      }
    });
    console.log(`✅ Deleted ${deletedOccupations.count} occupations.`);

    // 2. Delete Articles (Tarifs) except 2019
    console.log('🗑️ Deleting LigneOccupation references for non-2019 articles...');
    const deletedLignes = await prisma.ligneOccupation.deleteMany({
        where: {
            article: {
                annee: { not: 2019 }
            }
        }
    });
    console.log(`✅ Deleted ${deletedLignes.count} lines linked to non-2019 articles.`);

    console.log('🗑️ Deleting Articles (tarifs) except for year 2019...');
    const deletedArticles = await prisma.article.deleteMany({
      where: {
        annee: {
          not: 2019
        }
      }
    });
    console.log(`✅ Deleted ${deletedArticles.count} articles.`);

    // 3. Delete Configs except 2019
    console.log('🗑️ Deleting OdpConfig and TlpeConfig except for year 2019...');
    const deletedOdpConfig = await prisma.odpConfig.deleteMany({
      where: { annee: { not: 2019 } }
    });
    const deletedTlpeConfig = await prisma.tlpeConfig.deleteMany({
      where: { annee: { not: 2019 } }
    });
    console.log(`✅ Deleted ${deletedOdpConfig.count} OdpConfigs and ${deletedTlpeConfig.count} TlpeConfigs.`);

    console.log('✨ PostgreSQL cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPostgres();
