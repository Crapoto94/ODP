import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const BILLED_STATUSES = [
  'FACTURE', 'FACTURÉ',
  'TITRE', 'TITRÉ',
  'PAYE', 'PAYÉ',
  'CLOS'
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMINISTRATEUR') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const tiersId = parseInt(paramId);
    if (isNaN(tiersId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { annees } = await req.json();
    if (!Array.isArray(annees) || annees.length === 0) {
      return NextResponse.json({ error: 'Aucune année sélectionnée' }, { status: 400 });
    }

    const agentName = `${session.prenom} ${session.nom}`.trim() || 'Administrateur';
    const now = new Date();

    const occupationsToRevert = await (prisma as any).occupation.findMany({
      where: {
        tiersId,
        type: 'COMMERCE',
        anneeTaxation: { in: annees.map(Number) },
        statut: { in: BILLED_STATUSES }
      },
      select: { id: true, anneeTaxation: true, statut: true, numeroFacture: true }
    });

    if (occupationsToRevert.length === 0) {
      return NextResponse.json({ error: 'Aucune occupation à défacturer pour les années sélectionnées' }, { status: 404 });
    }

    const occupationIds = occupationsToRevert.map((o: any) => o.id);

    await (prisma as any).occupation.updateMany({
      where: { id: { in: occupationIds } },
      data: {
        statut: 'VALIDÉ',
        numeroFacture: null,
        facturePath: null,
        dateFACTURE: null,
        dateTITRE: null,
        dateCLOS: null
      }
    });

    const noteOperations: Promise<any>[] = [];
    for (const occ of occupationsToRevert) {
      noteOperations.push(
        (prisma as any).note.create({
          data: {
            occupationId: occ.id,
            content: `🔄 Défacturé — retour à VALIDÉ (${occ.anneeTaxation}) — ancien statut: ${occ.statut}${occ.numeroFacture ? `, facture: ${occ.numeroFacture}` : ''}`,
            author: agentName,
            isEmail: false,
            origin: 'desktop',
            created_at: now
          }
        })
      );
    }
    await Promise.all(noteOperations);

    const yearsReverted = [...new Set(occupationsToRevert.map((o: any) => o.anneeTaxation))];

    return NextResponse.json({
      success: true,
      revertedCount: occupationIds.length,
      years: yearsReverted,
      message: `${occupationIds.length} occupation(s) remise(s) en état VALIDÉ pour les années ${yearsReverted.join(', ')}`
    });

  } catch (err: any) {
    console.error('[DEFACTURER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
