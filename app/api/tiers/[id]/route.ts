import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID de tiers invalide' }, { status: 400 });
    }
    
    const tiers = await (prisma as any).tiers.findUnique({
      where: { id },
      include: { 
        contacts: true,
        occupations: {
          orderBy: { created_at: 'desc' },
          include: { _count: { select: { lignes: true } } }
        }
      }
    });

    if (!tiers) return NextResponse.json({ error: 'Tiers non trouvé' }, { status: 404 });

    return NextResponse.json(tiers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
