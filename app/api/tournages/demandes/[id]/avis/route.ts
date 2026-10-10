import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { assurerTablesTournage, lireConfigTournage } from '@/lib/tournage-service';
import { creerAvis, lienAvis } from '@/lib/tournage-avis';

async function autorise() {
  const s = await getSession();
  return s && hasPermissionServer(s.role, 'VIEW_TOURNAGES') ? s : null;
}

// Avis demandés pour une demande de tournage
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await autorise())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    await assurerTablesTournage();
    const rows = await (prisma as any).avisTournage.findMany({ where: { demandeId: Number(id) }, orderBy: { dateDemande: 'desc' } });
    const out = [];
    for (const r of rows) out.push({ ...r, lien: await lienAvis(r.token) });
    return NextResponse.json(out);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// Demande d'avis : { serviceIds: number[], libres: [{ nom, emails }], message }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await autorise();
  if (!s) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    await assurerTablesTournage();
    const demande = await (prisma as any).demandeTournage.findUnique({ where: { id: Number(id) } });
    if (!demande) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    const body = await req.json();
    if (!body.serviceIds?.length && !body.libres?.length) return NextResponse.json({ error: 'Choisissez au moins un service ou saisissez des adresses' }, { status: 400 });
    const resultats = await creerAvis(demande, await lireConfigTournage(), body, `${s.prenom} ${s.nom}`.trim());
    return NextResponse.json({ resultats });
  } catch (e: any) {
    console.error('[TOURNAGE AVIS]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
