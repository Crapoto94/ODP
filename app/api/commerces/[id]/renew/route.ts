import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const tiersId = parseInt(rawId);
    const body = await req.json();
    const { fromYear, toYear, lineIds } = body;

    if (!fromYear || !toYear || !lineIds || !Array.isArray(lineIds)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // 1. Fetch current lines to renew
    const sourceLines = await (prisma as any).ligneOccupation.findMany({
      where: { id: { in: lineIds } },
      include: {
        article: true,
        occupation: true
      }
    });

    if (sourceLines.length === 0) {
      return NextResponse.json({ error: 'Aucun dispositif trouvé' }, { status: 400 });
    }

    // 2. Fetch target articles for the next year
    const targetArticles = await (prisma as any).article.findMany({
      where: { annee: toYear }
    });

    // 3. Check if an occupation for toYear already exists for this tiers
    let targetOccupation = await (prisma as any).occupation.findFirst({
      where: {
        tiersId,
        anneeTaxation: toYear,
        type: 'COMMERCE'
      }
    });

    // 4. Create target occupation if it doesn't exist
    if (!targetOccupation) {
      targetOccupation = await (prisma as any).occupation.create({
        data: {
          tiersId,
          type: 'COMMERCE',
          statut: 'EN_COURS',
          anneeTaxation: toYear,
          adresse: sourceLines[0].occupation.adresse || 'À renseigner',
          dateDebut: new Date(`${toYear}-01-01T12:00:00.000Z`),
          dateFin: new Date(`${toYear}-12-31T12:00:00.000Z`),
          nom: sourceLines[0].occupation.nom || 'Occupation Reconduite'
        }
      });
    }

    // 5. Create new lines
    const newLinesData = [];
    for (const sourceLine of sourceLines) {
      const match = targetArticles.find((a: any) => a.designation === sourceLine.article.designation);
      if (!match) continue;

      newLinesData.push({
        occupationId: targetOccupation.id,
        articleId: match.id,
        quantite1: sourceLine.quantite1,
        quantite2: sourceLine.quantite2,
        dateDebut: new Date(`${toYear}-01-01T12:00:00.000Z`),
        dateFin: new Date(`${toYear}-12-31T12:00:00.000Z`),
        montant: match.montant * (sourceLine.quantite1 || 0) * (sourceLine.quantite2 || 1),
        note: sourceLine.note,
        photos: sourceLine.photos
      });
    }

    if (newLinesData.length > 0) {
      await (prisma as any).ligneOccupation.createMany({
        data: newLinesData
      });

      // Recalculate total for the new occupation
      const { updateOccupationTotal } = await import('@/lib/tlpe-utils');
      await updateOccupationTotal(targetOccupation.id);
    }

    return NextResponse.json({ 
      success: true, 
      count: newLinesData.length,
      occupationId: targetOccupation.id 
    });

  } catch (err: any) {
    console.error('[RENEW ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
