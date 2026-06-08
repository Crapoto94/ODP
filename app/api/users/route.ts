import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSession } from '@/lib/auth';
import { hasPermissionServer as hasPermission } from '@/lib/permissions-server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MANAGE_USERS')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        login: true,
        role: true,
        isAd: true,
        created_at: true
      }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('[GET USERS ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MANAGE_USERS')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await req.json();
    const isAd = !!data.isAd;

    const hashedPassword = isAd
      ? '__AD_AUTH__'
      : await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        login: data.login || '',
        password: hashedPassword,
        role: data.role || 'SAISIE',
        isAd: isAd,
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, nom: user.nom } });
  } catch (error: any) {
    console.error('[POST USERS ERROR]', error);
    return NextResponse.json({ error: 'Erreur lors de la création (login/email déjà utilisé ?)' }, { status: 500 });
  }
}
