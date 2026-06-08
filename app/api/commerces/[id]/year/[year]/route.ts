import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer as hasPermission } from '@/lib/permissions-server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; year: string }> }
) {
  try {
    const { id: tiersIdStr, year: yearStr } = await params;
    const tiersId = parseInt(tiersIdStr);
    const year = parseInt(yearStr);

    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MODIFY_DOSSIER')) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    if (isNaN(tiersId) || isNaN(year)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    // Trouver les occupations pour cette année et ce commerce
    const occupations = await (prisma as any).occupation.findMany({
      where: {
        tiersId,
        anneeTaxation: year,
        type: 'COMMERCE',
      },
    });

    if (occupations.length === 0) {
      return NextResponse.json(
        { error: 'Aucun dossier trouvé pour cette année' },
        { status: 404 }
      );
    }

    // Supprimer toutes les occupations (cascade supprime lignes, notes, contacts, dispositifs)
    for (const occ of occupations) {
      await (prisma as any).occupation.delete({ where: { id: occ.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Commerce Year Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
