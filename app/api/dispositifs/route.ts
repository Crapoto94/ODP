import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, occupationId } = body;

    if (!nom || !occupationId) {
      return NextResponse.json({ error: 'Nom et occupationId sont requis' }, { status: 400 });
    }

    const dispositif = await (prisma as any).dispositif.create({
      data: {
        nom,
        occupationId: parseInt(occupationId),
        statut: 'EN_ATTENTE'
      }
    });

    return NextResponse.json(dispositif);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
