import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Vue tiers-centree pour les dossiers TLPE (meme principe que
// app/api/commerces/[id]/route.ts) : [id] = tiersId, retourne le tiers +
// tous ses dossiers TLPE (toutes annees), pour le selecteur d'annee.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const tierId = parseInt(id);

    const tiers = await (prisma as any).tiers.findUnique({
      where: { id: tierId }
    });

    if (!tiers) {
      return NextResponse.json({ error: 'Tiers not found' }, { status: 404 });
    }

    const occupations = await (prisma as any).occupation.findMany({
      where: { tiersId: tierId, type: 'TLPE' },
      include: {
        lignes: {
          where: { deletedAt: null },
          include: { article: true }
        },
        contacts: true,
        notes: { orderBy: { created_at: 'desc' } }
      },
      orderBy: { anneeTaxation: 'desc' }
    });

    const years = occupations
      .map((o: any) => o.anneeTaxation)
      .filter((y: any, i: number, arr: any[]) => y && arr.indexOf(y) === i)
      .sort((a: number, b: number) => b - a);

    return NextResponse.json({
      tiers: {
        id: tiers.id,
        nom: tiers.nom,
        code_sedit: tiers.code_sedit,
        siret: tiers.siret,
        adresse: tiers.adresse,
        email: tiers.email,
        statut: tiers.statut,
        observations: tiers.observations,
        photo: tiers.photo
      },
      years,
      occupations
    });
  } catch (err: any) {
    console.error('[tlpe-detail]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await (prisma as any).tiers.update({
      where: { id: parseInt(id) },
      data: body
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH-TLPE-TIERS] Error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
