import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Update occupations of this commerce, optionally filtered by year
    const updated = await (prisma as any).occupation.updateMany({
      where: {
        tiersId,
        type: 'COMMERCE',
        ...(annee ? { anneeTaxation: parseInt(annee) } : {})
      },
      data: {
        statut
      }
    });

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
