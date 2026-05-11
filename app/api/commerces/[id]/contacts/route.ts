import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tiersId = parseInt(id);
    const contacts = await (prisma as any).contact.findMany({
      where: { tiersId },
      orderBy: { created_at: 'asc' }
    });
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tiersId = parseInt(id);
    const body = await req.json();
    const { nom, prenom, email, telephone, titre, entreprise, role, pjPath } = body;

    const contact = await (prisma as any).contact.create({
      data: {
        nom: nom || null,
        prenom: prenom || null,
        email: email || null,
        telephone: telephone || null,
        titre: titre || null,
        entreprise: entreprise || null,
        role: role || 'CONTACT_DIRECT',
        pjPath: pjPath || null,
        tiersId
      }
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id: contactId, nom, prenom, email, telephone, titre, entreprise, role } = body;

    const contact = await (prisma as any).contact.update({
      where: { id: parseInt(contactId) },
      data: {
        nom: nom || null,
        prenom: prenom || null,
        email: email || null,
        telephone: telephone || null,
        titre: titre || null,
        entreprise: entreprise || null,
        role: role || 'CONTACT_DIRECT',
        pjPath: body.pjPath || undefined
      }
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    await (prisma as any).contact.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
