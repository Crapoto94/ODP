import { prisma, initializePrisma } from '../lib/prisma';

const TABLES = [
  'User', 'Tiers', 'Occupation', 'Contact', 'Note', 'Article',
  'Categorie', 'ModeTaxation', 'LigneOccupation', 'Dispositif',
  'Gabarit', 'FavoriteCommerce', 'MobileLog', 'ContextualMessage',
  'SignatureRequest', 'TlpeConfig', 'TypeDossierConfig', 'O365Message',
];

// Tables dont le PK n'est pas "id" ou pas un integer
const SKIP_TABLES = ['O365Message', 'TlpeConfig'];

async function fixAutoIncrement() {
  await initializePrisma(true);
  console.log('🔧 Correction des auto-incréments PostgreSQL...\n');

  // 1. Supprimer le user avec id NULL
  try {
    await (prisma as any).$executeRawUnsafe(`DELETE FROM "User" WHERE id IS NULL`);
    console.log('🗑️  Supprimé le user avec id NULL\n');
  } catch (e: any) {
    console.log('ℹ️  Pas de user NULL à supprimer\n');
  }

  for (const table of TABLES) {
    if (SKIP_TABLES.includes(table)) continue;

    try {
      // Récupérer le max ID
      const result: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT COALESCE(MAX(id), 0)::int as max_id FROM "${table}"`
      );
      const maxId = Number(result[0]?.max_id || 0);
      const nextVal = maxId + 1;

      // Créer la séquence si elle n'existe pas
      const seqName = `${table}_id_seq`;
      await (prisma as any).$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START WITH ${nextVal}`
      );

      // Resynchroniser la séquence avec le max ID
      await (prisma as any).$executeRawUnsafe(
        `SELECT setval('"${seqName}"', ${nextVal}, false)`
      );

      // Mettre le DEFAULT sur la colonne id
      await (prisma as any).$executeRawUnsafe(
        `ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT nextval('"${seqName}"')`
      );

      // S'assurer que id est NOT NULL
      await (prisma as any).$executeRawUnsafe(
        `ALTER TABLE "${table}" ALTER COLUMN id SET NOT NULL`
      );

      console.log(`  ✅ ${table}: séquence créée, nextval = ${nextVal}`);
    } catch (err: any) {
      console.warn(`  ⚠️  ${table}: ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n✅ Toutes les séquences sont en place.');
  process.exit(0);
}

fixAutoIncrement().catch(err => { console.error(err); process.exit(1); });
