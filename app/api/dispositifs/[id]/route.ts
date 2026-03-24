import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { statut, nom } = body;

    const dispositif = await (prisma as any).dispositif.update({
      where: { id: parseInt(id) },
      data: {
        statut: statut !== undefined ? statut : undefined,
        nom: nom !== undefined ? nom : undefined
      }
    });

    return NextResponse.json(dispositif);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await (prisma as any).dispositif.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
