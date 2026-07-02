import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: liste les autorisations d'un dossier (occupation)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const occupationId = parseInt(id);

    const autorisations = await (prisma as any).autorisation.findMany({
      where: { occupationId },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    });

    return NextResponse.json(autorisations);
  } catch (err: any) {
    console.error('[GET autorisations]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: crée une autorisation pour un dossier
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const occupationId = parseInt(id);
    const body = await request.json();
    const { libelle, gabaritId, dateDebut, dateFin, ligneIds } = body;

    if (!libelle || !libelle.trim()) {
      return NextResponse.json({ error: 'Libellé requis' }, { status: 400 });
    }

    // ordre = à la suite des autorisations existantes
    const count = await (prisma as any).autorisation.count({ where: { occupationId } });

    const autorisation = await (prisma as any).autorisation.create({
      data: {
        occupationId,
        libelle: libelle.trim(),
        gabaritId: gabaritId ? parseInt(gabaritId) : null,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        ligneIds: ligneIds ? JSON.stringify(ligneIds) : null,
        ordre: count,
      },
    });

    return NextResponse.json(autorisation);
  } catch (err: any) {
    console.error('[POST autorisations]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
