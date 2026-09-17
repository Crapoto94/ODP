import { NextResponse } from 'next/server';
import { getSession, encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ mode: session?.devMode === true ? 'DEV' : 'PROD' });
}

export async function POST(req: Request) {
  try {
    const { mode } = await req.json();
    if (mode !== 'PROD' && mode !== 'DEV') {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Le mode DEV est réservé aux administrateurs ; les autres profils
    // ne peuvent rester qu'en mode PROD.
    if (mode === 'DEV' && session.role !== 'ADMINISTRATEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Le mode est stocke sur LA SESSION de l'utilisateur courant, pas dans un
    // fichier de config global : basculer en DEV ne doit affecter que
    // l'admin qui le demande, jamais les autres utilisateurs de l'app.
    const sessionToken = await encrypt({ ...session, devMode: mode === 'DEV' });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, mode });
  } catch (error: any) {
    console.error('[DB MODE UPDATE ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
