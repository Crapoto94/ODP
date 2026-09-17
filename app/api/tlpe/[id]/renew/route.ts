import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Meme logique que app/api/commerces/[id]/renew/route.ts, appliquee au TLPE.
// [id] = tiersId. Utilise prisma.note.create (pas de SQL brut) pour rester
// compatible Postgres.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const tiersId = parseInt(rawId);
    const body = await req.json();
    const { fromYear, toYear, lineIds } = body;

    if (!fromYear || !toYear || !lineIds || !Array.isArray(lineIds)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

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

    const targetArticles = await (prisma as any).article.findMany({
      where: { annee: toYear }
    });

    let targetOccupation = await (prisma as any).occupation.findFirst({
      where: {
        tiersId,
        anneeTaxation: toYear,
        type: 'TLPE'
      }
    });

    if (!targetOccupation) {
      targetOccupation = await (prisma as any).occupation.create({
        data: {
          tiersId,
          type: 'TLPE',
          statut: 'INITIALISATION',
          anneeTaxation: toYear,
          adresse: sourceLines[0].occupation.adresse || 'À renseigner',
          dateDebut: new Date(`${toYear}-01-01T12:00:00.000Z`),
          dateFin: new Date(`${toYear}-12-31T12:00:00.000Z`),
          nom: sourceLines[0].occupation.nom || 'Occupation Reconduite'
        }
      });
    }

    const newLinesData: any[] = [];
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
        montant: match.montant,
        note: sourceLine.note,
        photos: sourceLine.photos
      });
    }

    if (newLinesData.length > 0) {
      await (prisma as any).ligneOccupation.createMany({
        data: newLinesData
      });

      const { updateOccupationTotal } = await import('@/lib/tlpe-utils');
      await updateOccupationTotal(targetOccupation.id);

      const session = await getSession();
      const author = session ? `${session.prenom} ${session.nom}`.trim() : 'Système';
      const year = targetOccupation.anneeTaxation || new Date().getFullYear();

      await (prisma as any).note.create({
        data: {
          occupationId: targetOccupation.id,
          content: `🔄 Reconduction des dispositifs de l'année ${fromYear} à ${toYear} (${newLinesData.length} ligne${newLinesData.length > 1 ? 's' : ''}) (${year})`,
          author,
          isEmail: false,
          origin: 'desktop',
          created_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      count: newLinesData.length,
      occupationId: targetOccupation.id
    });

  } catch (err: any) {
    console.error('[TLPE-RENEW ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
