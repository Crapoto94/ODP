import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const tier = await prisma.tiers.findUnique({
      where: { id: Number(paramId) }
    });
    
    if (!tier) {
      return NextResponse.json({ error: 'Tiers non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json(tier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const body = await req.json();
    const { code_sedit } = body;
    
    if (!code_sedit) {
      return NextResponse.json({ error: 'Le code SEDIT est requis' }, { status: 400 });
    }
    
    const tier = await prisma.tiers.update({
      where: { id: Number(paramId) },
      data: {
        code_sedit,
        statut: 'DEFINITIF'
      }
    });
    
    return NextResponse.json(tier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
