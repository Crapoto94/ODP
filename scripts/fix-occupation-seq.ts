import { prisma, initializePrisma } from '../lib/prisma';

async function fixOccupation() {
  await initializePrisma(true);

  // Supprimer les occupations avec id NULL  
  const deleted = await (prisma as any).$executeRawUnsafe(
    `DELETE FROM "Occupation" WHERE id IS NULL`
  );
  console.log(`Occupations NULL supprimées: ${deleted}`);

  // Max ID
  const result: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT COALESCE(MAX(id), 0)::int as max_id FROM "Occupation"`
  );
  const maxId = Number(result[0]?.max_id || 0);
  const nextVal = maxId + 1;

  // Créer séquence + default
  await (prisma as any).$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS "Occupation_id_seq" START WITH ${nextVal}`
  );
  await (prisma as any).$executeRawUnsafe(
    `SELECT setval('"Occupation_id_seq"', ${nextVal}, false)`
  );
  await (prisma as any).$executeRawUnsafe(
    `ALTER TABLE "Occupation" ALTER COLUMN id SET DEFAULT nextval('"Occupation_id_seq"')`
  );
  await (prisma as any).$executeRawUnsafe(
    `ALTER TABLE "Occupation" ALTER COLUMN id SET NOT NULL`
  );

  console.log(`✅ Occupation: séquence créée, nextval = ${nextVal}`);
  process.exit(0);
}

fixOccupation().catch(err => { console.error(err); process.exit(1); });
