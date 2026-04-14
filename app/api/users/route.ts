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

    const users = await (prisma as any).$queryRaw`
      SELECT id, nom, prenom, email, login, role, isAd, created_at FROM "User"
    `;

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
    const isAd = !!data.isAd;

    // Les comptes AD n'ont pas de mot de passe local — on stocke une valeur sentinel
    const hashedPassword = isAd
      ? '__AD_AUTH__'
      : await bcrypt.hash(data.password, 10);

    const email = data.email || '';
    const nom = data.nom || '';
    const prenom = data.prenom || '';
    const login = data.login || '';
    const role = data.role || 'AGENT_TERRAIN';
    const isAdInt = isAd ? 1 : 0;

    await (prisma as any).$executeRaw`
      INSERT INTO "User" (nom, prenom, email, login, password, role, isAd, created_at, updated_at)
      VALUES (${nom}, ${prenom}, ${email}, ${login}, ${hashedPassword}, ${role}, ${isAdInt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const rows = await (prisma as any).$queryRaw`
      SELECT id, nom FROM "User" WHERE login = ${login} LIMIT 1
    `;
    const user = (rows as any[])[0];

    return NextResponse.json({ success: true, user: { id: user.id, nom: user.nom } });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la création (login/email déjà utilisé ?)' }, { status: 500 });
  }
}
