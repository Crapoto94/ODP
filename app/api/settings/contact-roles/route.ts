import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.contactRoleConfig.findMany({
      orderBy: [
        { ordre: 'asc' },
        { nom: 'asc' }
      ]
    });
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('[GET CONTACT ROLES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nom, isSendAot, ordre } = await req.json();
    if (!nom?.trim()) return NextResponse.json({ error: 'nom requis' }, { status: 400 });

    const role = await prisma.contactRoleConfig.create({
      data: {
        nom: nom.trim(),
        isSendAot: !!isSendAot,
        ordre: parseInt(ordre) || 0
      }
    });

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('[POST CONTACT ROLES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, nom, isSendAot, ordre } = await req.json();
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const role = await prisma.contactRoleConfig.update({
      where: { id: parseInt(id) },
      data: {
        nom: nom?.trim(),
        isSendAot: isSendAot !== undefined ? !!isSendAot : undefined,
        ordre: ordre !== undefined ? parseInt(ordre) : undefined,
        updated_at: new Date()
      }
    });

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('[PUT CONTACT ROLES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    await prisma.contactRoleConfig.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE CONTACT ROLES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
