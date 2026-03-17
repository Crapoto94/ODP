import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const users = await (prisma as any).user.findMany({
      select: { id: true, nom: true, prenom: true, email: true, login: true, role: true, created_at: true }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await req.json();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await (prisma as any).user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        login: data.login,
        password: hashedPassword,
        role: data.role
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, nom: user.nom } });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la création (login/email déjà utilisé ?)' }, { status: 500 });
  }
}
