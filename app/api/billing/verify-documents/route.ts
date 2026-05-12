import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { ids, type } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    // Fetch dossiers
    let dossiers: any[] = [];
    if (type === 'COMMERCE') {
      const occupations = await (prisma as any).occupation.findMany({
        where: { tiersId: { in: ids }, type: 'COMMERCE', statut: { in: ['VERIFIE', 'VALIDE', 'VALIDÉ'] } },
        include: { tiers: true }
      });
      const grouped = new Map();
      occupations.forEach((occ: any) => {
        if (!grouped.has(occ.tiersId)) {
          grouped.set(occ.tiersId, {
            id: occ.tiersId,
            type: 'COMMERCE',
            anneeTaxation: occ.anneeTaxation
          });
        }
      });
      dossiers = Array.from(grouped.values());
    } else {
      dossiers = await (prisma as any).occupation.findMany({
        where: { id: { in: ids }, type: type, statut: { in: ['VERIFIE', 'VALIDE', 'VALIDÉ'] } },
        select: { id: true, type: true, anneeTaxation: true, dateDebut: true }
      });
    }

    if (dossiers.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier trouvé' }, { status: 400 });
    }

    // Determine all taxation years needed
    const yearsNeeded = Array.from(new Set(
      dossiers.map(d => {
        // For CHANTIER/TOURNAGE, use dateDebut year if anneeTaxation is not set or seems wrong
        if ((type === 'CHANTIER' || type === 'TOURNAGE') && (!d.anneeTaxation || d.anneeTaxation > currentYear)) {
          if (d.dateDebut) {
            return new Date(d.dateDebut).getFullYear();
          }
        }
        return d.anneeTaxation || currentYear;
      })
    )).sort();

    // Fetch ODP configs for those years
    const odpConfigs = await (prisma as any).odpConfig.findMany({
      where: { annee: { in: yearsNeeded } }
    });
    const configMap = new Map(odpConfigs.map((c: any) => [c.annee, c]));

    // Verify documents
    const missingDocuments: any[] = [];
    const isOdp = type === 'CHANTIER' || type === 'TOURNAGE';

    if (isOdp) {
      // ODP documents: délibération + tarifs (ODP or Tournages)
      for (const year of yearsNeeded) {
        const config = configMap.get(year) as any;
        const docs: string[] = [];

        if (!config?.deliberationPath) {
          docs.push('Délibération');
        }

        if (type === 'TOURNAGE' && !config?.tarifsTournagesPath) {
          docs.push('Tarifs Tournages');
        } else if (type === 'CHANTIER' && !config?.tarifsOdpPath) {
          docs.push('Tarifs ODP');
        }

        if (docs.length > 0) {
          missingDocuments.push({ year, documents: docs });
        }
      }
    } else {
      // TLPE: délibération
      const tlpeConfig = await (prisma as any).tlpeConfig.findUnique({
        where: { annee: currentYear }
      });

      if (!tlpeConfig?.deliberationPath) {
        missingDocuments.push({ year: currentYear, documents: ['Délibération'] });
      }
    }

    return NextResponse.json({
      success: missingDocuments.length === 0,
      missingDocuments,
      yearsNeeded,
      dossierCount: dossiers.length
    });
  } catch (err: any) {
    console.error('[VERIFY-DOCUMENTS-ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
