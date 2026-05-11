import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { authenticateAD } from '@/lib/ad';

export async function POST(req: Request) {
  try {
    const { login: inputLogin, password: inputPassword } = await req.json();
    
    // 🕵️ Externalized admin config
    const { getLocalConfig } = require('@/lib/prisma');
    const config = getLocalConfig();
    const adminConfig = config?.admin;

    if (adminConfig && inputLogin === adminConfig.login && inputPassword === adminConfig.password) {
      const realAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const adminId = realAdmin ? realAdmin.id : 0;
      
      const sessionToken = await encrypt({
        id: adminId,
        login: adminConfig.login,
        nom: 'ADMIN',
        prenom: 'Fichier',
        role: 'ADMIN'
      });
      
      const cookieStore = await cookies();
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: false, 
        sameSite: 'lax',
        path: '/'
      });

      return NextResponse.json({ 
        success: true, 
        redirect: '/dashboard',
        user: { id: adminId, nom: 'ADMIN', prenom: 'Fichier', role: 'ADMIN' }
      });
    }

    const login = inputLogin;
    const password = inputPassword;

    // 1. Search by exact login
    let user = await prisma.user.findFirst({
        where: {
            login: {
                equals: login,
                mode: 'insensitive'
            }
        }
    });

    // 2. If not found, try searching for AD account (matching UPN prefix)
    if (!user) {
        user = await prisma.user.findFirst({
            where: {
                isAd: true,
                login: {
                    startsWith: login,
                    mode: 'insensitive'
                }
            }
        });
    }

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    let isMatch = false;
    if (user.isAd) {
      // AD account authentication via proxy
      isMatch = await authenticateAD(user.login, password);
    } else {
      // Local account: bcrypt check
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
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true, redirect: '/dashboard' });

  } catch (error: any) {
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
