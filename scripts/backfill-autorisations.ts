import { prisma, initializePrisma } from '../lib/prisma';

/**
 * Backfill : pour chaque occupation portant une AOT "plate" historique
 * (aotFinalPath ou aotGabaritId), crée une Autorisation équivalente si aucune
 * n'existe encore pour ce dossier. Idempotent.
 *
 * Lancement : npx tsx scripts/backfill-autorisations.ts
 */
async function backfill() {
  await initializePrisma(true);
  console.log('🔧 Backfill des autorisations (AOT historiques → Autorisation)...\n');

  const occupations = await (prisma as any).occupation.findMany({
    where: {
      OR: [
        { aotFinalPath: { not: null } },
        { aotGabaritId: { not: null } },
      ],
    },
    select: {
      id: true,
      nom: true,
      aotFinalPath: true,
      aotGabaritId: true,
      aotSigned: true,
      aotDate: true,
      dateDebut: true,
      dateFin: true,
    },
  });

  console.log(`→ ${occupations.length} dossier(s) avec AOT historique trouvés.\n`);

  let created = 0;
  let skipped = 0;

  for (const occ of occupations) {
    const existing = await (prisma as any).autorisation.count({ where: { occupationId: occ.id } });
    if (existing > 0) {
      skipped++;
      continue;
    }

    // finalPath : uniquement si PDF (la fusion nécessite un PDF)
    const finalPath = occ.aotFinalPath && occ.aotFinalPath.toLowerCase().endsWith('.pdf')
      ? occ.aotFinalPath
      : null;

    await (prisma as any).autorisation.create({
      data: {
        occupationId: occ.id,
        libelle: occ.nom ? `AOT - ${occ.nom}` : 'AOT',
        gabaritId: occ.aotGabaritId || null,
        dateDebut: occ.dateDebut || null,
        dateFin: occ.dateFin || null,
        finalPath,
        signed: !!occ.aotSigned,
        dateSignature: occ.aotDate || null,
      },
    });
    created++;
    console.log(`  ✓ Occupation ${occ.id} → Autorisation créée`);
  }

  console.log(`\n✅ Terminé. Créées: ${created} · Ignorées (déjà présentes): ${skipped}\n`);
}

backfill()
  .catch((e) => { console.error('❌ Backfill échoué:', e); process.exit(1); })
  .finally(async () => { await (prisma as any).$disconnect?.(); });
