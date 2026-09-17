import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Liste des dossiers TLPE, un tiers = une ligne (comme /api/commerces),
// pour la page /dashboard/tlpe.
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const occupations = await (prisma as any).occupation.findMany({
      where: { type: 'TLPE' },
      include: {
        tiers: true,
        lignes: { where: { deletedAt: null } }
      },
      orderBy: { anneeTaxation: 'desc' }
    });

    const byTiers = new Map<number, any>();
    for (const occ of occupations) {
      if (!occ.tiers) continue;
      const tierId = occ.tiers.id;
      const montant = occ.montantCalcule || 0;

      if (!byTiers.has(tierId)) {
        byTiers.set(tierId, {
          id: tierId,
          nom: occ.tiers.nom,
          code_sedit: occ.tiers.code_sedit,
          adresse: occ.tiers.adresse,
          years: [],
          lastYear: occ.anneeTaxation,
          lastYearStatut: occ.statut,
          lastYearTotal: montant,
          nbDispositifs: occ.lignes.length
        });
      }
      const entry = byTiers.get(tierId);
      if (occ.anneeTaxation && !entry.years.includes(occ.anneeTaxation)) entry.years.push(occ.anneeTaxation);
      if (occ.anneeTaxation && occ.anneeTaxation >= entry.lastYear) {
        entry.lastYear = occ.anneeTaxation;
        entry.lastYearStatut = occ.statut;
        entry.lastYearTotal = montant;
        entry.nbDispositifs = occ.lignes.length;
      }
    }

    const result = Array.from(byTiers.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[tlpe-list]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
