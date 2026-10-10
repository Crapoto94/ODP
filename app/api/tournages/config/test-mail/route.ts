import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { lireConfigTournage } from '@/lib/tournage-service';
import { envoyerMailTest } from '@/lib/tournage-mail';

// Envoie le modèle « accusé de réception » (données fictives) pour contrôler expéditeur et pied de page
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !hasPermissionServer(s.role, 'MANAGE_USERS')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    const { to } = await req.json();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return NextResponse.json({ error: 'Adresse invalide' }, { status: 400 });
    const r = await envoyerMailTest(String(to), await lireConfigTournage());
    if (r.skipped) return NextResponse.json({ error: 'Le modèle « Accusé de réception » est désactivé' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
