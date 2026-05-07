import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, year: string }> }
) {
  try {
    const { id: tiersIdStr, year: yearStr } = await params;
    const tiersId = parseInt(tiersIdStr);
    const year = parseInt(yearStr);
    
    console.log(`[DELETE YEAR] Tiers: ${tiersId}, Year: ${year}`);

    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      console.warn('[DELETE YEAR] Unauthorized attempt or session missing', session);
      return NextResponse.json({ error: 'Seul un administrateur peut supprimer une année de taxation' }, { status: 403 });
    }

    if (isNaN(tiersId) || isNaN(year)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    // 1. Trouver l'occupation (dossier) pour cette année et ce commerce
    const occupation = await (prisma as any).occupation.findFirst({
      where: {
        tiersId,
        anneeTaxation: year,
        type: 'COMMERCE'
      }
    });

    if (!occupation) {
      console.warn(`[DELETE YEAR] No occupation found for Tiers ${tiersId} in ${year}`);
      return NextResponse.json({ error: 'Aucun dossier trouvé pour cette année' }, { status: 404 });
    }

    console.log(`[DELETE YEAR] Found occupation ID: ${occupation.id}. Deleting lines...`);

    // 2. Supprimer les dispositifs associés (LigneArticle)
    await (prisma as any).ligneArticle.deleteMany({
      where: { occupationId: occupation.id }
    });

    console.log(`[DELETE YEAR] Lines deleted. Deleting occupation...`);

    // 3. Supprimer l'occupation
    await (prisma as any).occupation.delete({
      where: { id: occupation.id }
    });

    console.log(`[DELETE YEAR] Success.`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Commerce Year Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
