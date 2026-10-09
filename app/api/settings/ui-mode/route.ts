import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UI_COOKIE, getUiMode } from '@/lib/ui-mode';

export async function GET() {
  return NextResponse.json({ mode: await getUiMode() });
}

// Ouvert à tous les utilisateurs (pas de contrôle de rôle) : il s'agit d'une simple préférence d'affichage.
export async function POST(req: Request) {
  const { mode } = await req.json().catch(() => ({}));
  if (mode !== 'v2' && mode !== 'classic') {
    return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
  }
  const store = await cookies();
  store.set(UI_COOKIE, mode, { httpOnly: false, secure: false, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ success: true, mode });
}
