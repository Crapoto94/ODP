import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const id = parseInt(params.id);

    const article = await (prisma as any).article.update({
      where: { id },
      data: {
        designation: body.designation,
        numero: body.numero,
        chapitre: body.chapitre,
        codeInterne: body.codeInterne,
        fonction: body.fonction,
        gestionnaire: body.gestionnaire,
        nature: body.nature,
        sens: body.sens,
        structure: body.structure,
        typeMouvement: body.typeMouvement,
        montant: body.montant || 0
      },
      include: { modeTaxation: true }
    });

    return NextResponse.json(article);
  } catch (err: any) {
    console.error('Comptabilité PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await (prisma as any).article.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Comptabilité DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
