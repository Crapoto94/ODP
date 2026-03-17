import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const gabarit = await (prisma as any).gabarit.findUnique({
      where: { id }
    });
    if (!gabarit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(gabarit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await req.json();
    const { nom, contenu, isDefault } = body;

    if (isDefault) {
       await (prisma as any).gabarit.updateMany({
         where: { isDefault: true, id: { not: id } },
         data: { isDefault: false }
       });
    }

    const gabarit = await (prisma as any).gabarit.update({
      where: { id },
      data: {
        nom,
        contenu: contenu ? (typeof contenu === 'string' ? contenu : JSON.stringify(contenu)) : undefined,
        isDefault
      }
    });

    return NextResponse.json(gabarit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    await (prisma as any).gabarit.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
