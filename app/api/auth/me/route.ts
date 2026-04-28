import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await decrypt(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      id: session.id,
      login: session.login,
      nom: session.nom,
      prenom: session.prenom,
      role: session.role
    });
  } catch (error: any) {
    console.error('[GET /api/auth/me]', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
