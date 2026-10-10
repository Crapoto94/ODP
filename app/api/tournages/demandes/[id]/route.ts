import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { STATUTS_DEMANDE } from '@/lib/tournage-regles';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  const row = await (prisma as any).demandeTournage.findUnique({ where: { id: Number(id) } });
  if (!row) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  return NextResponse.json(row);
}

// Changement de statut / notes internes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.statut !== undefined) {
    if (!STATUTS_DEMANDE[body.statut]) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    data.statut = body.statut;
    data.traiteePar = `${session.prenom} ${session.nom}`.trim();
  }
  if (body.notesInternes !== undefined) data.notesInternes = String(body.notesInternes);
  const row = await (prisma as any).demandeTournage.update({ where: { id: Number(id) }, data });
  return NextResponse.json(row);
}
