import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const PROCESS_STEPS = [
  'INITIALISATION',
  'INSTRUCTION',
  'PREPARATION_AOT',
  'EN_COURS',
  'VALIDÉ',
  'FACTURÉ',
  'TITRÉ',
  'CLOS',
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const tiersId = parseInt(paramId);
    const { statut, annee } = await req.json();

    if (!statut || !PROCESS_STEPS.includes(statut)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Fetch occupations before update to detect changes
    const occupationsToUpdate = await (prisma as any).occupation.findMany({
      where: {
        tiersId,
        type: 'COMMERCE',
        ...(annee ? { anneeTaxation: parseInt(annee) } : {})
      },
      select: { id: true, statut: true }
    });

    const statusDateMap: Record<string, string> = {
      'INITIALISATION': 'dateINIT',
      'INSTRUCTION': 'dateINST',
      'PREPARATION_AOT': 'datePREP',
      'EN_COURS': 'dateEN_COURS',
      'VALIDÉ': 'dateVALIDE',
      'FACTURÉ': 'dateFACTURE',
      'TITRÉ': 'dateTITRE',
      'CLOS': 'dateCLOS'
    };

    const dateField = statusDateMap[statut];
    const now = new Date();

    // Update occupations of this commerce, optionally filtered by year
    const updated = await (prisma as any).occupation.updateMany({
      where: {
        tiersId,
        type: 'COMMERCE',
        ...(annee ? { anneeTaxation: parseInt(annee) } : {})
      },
      data: {
        statut,
        ...(dateField ? { [dateField]: now } : {})
      }
    });

    // Add automatic notes for changed occupations
    if (updated.count > 0) {
      const session = await getSession();
      const author = session ? `${session.prenom} ${session.nom}`.trim() : 'Conseiller';
      const now = new Date().toISOString();

      for (const occ of occupationsToUpdate) {
        if (occ.statut !== statut) {
          const year = occ.anneeTaxation || new Date().getFullYear();
          const noteContent = `📊 Passage de statut : ${occ.statut} → ${statut} (${year})`;
          await (prisma as any).$executeRawUnsafe(
            `INSERT INTO Note (occupationId, content, author, isEmail, origin, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            occ.id,
            noteContent,
            author,
            false,
            'desktop',
            now
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updated.count,
      status: statut
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
