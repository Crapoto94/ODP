import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const occupationId = parseInt(id);
    const contacts = await (prisma as any).contact.findMany({
      where: { occupationId },
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
    const occupationId = parseInt(id);
    const body = await req.json();
    const { prenom, email, role } = body;

    if (!prenom || !email || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const contact = await (prisma as any).contact.create({
      data: {
        prenom,
        email,
        role,
        occupationId
      }
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
