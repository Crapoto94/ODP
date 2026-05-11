import { prisma, initializePrisma } from '../lib/prisma';

async function listSequences() {
  await initializePrisma(true);

  // Lister toutes les séquences du schéma actif
  const sequences: any[] = await (prisma as any).$queryRawUnsafe(`
    SELECT sequence_name, data_type 
    FROM information_schema.sequences 
    WHERE sequence_schema = current_schema()
    ORDER BY sequence_name
  `);

  console.log('Séquences trouvées:');
  for (const seq of sequences) {
    console.log(`  - ${seq.sequence_name}`);
  }

  // Aussi vérifier les colonnes avec des defaults de séquence
  const columns: any[] = await (prisma as any).$queryRawUnsafe(`
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE column_default LIKE '%nextval%'
    AND table_schema = current_schema()
    ORDER BY table_name
  `);

  console.log('\nColonnes avec auto-increment:');
  for (const col of columns) {
    console.log(`  - ${col.table_name}.${col.column_name} → ${col.column_default}`);
  }

  // Vérifier le user sans ID
  const badUsers: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT id, nom, prenom, login FROM "User" ORDER BY id`
  );
  console.log('\nUtilisateurs en base:');
  for (const u of badUsers) {
    console.log(`  ID=${u.id} | ${u.prenom} ${u.nom} (${u.login})`);
  }

  process.exit(0);
}

listSequences().catch(err => { console.error(err); process.exit(1); });
