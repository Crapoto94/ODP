import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { STATUTS_DEMANDE } from '@/lib/tournage-regles';
import { lireConfigTournage } from '@/lib/tournage-service';
import { envoyerMailTournage } from '@/lib/tournage-mail';

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
  // Mail au demandeur (accord / complément / refus) si demandé par l'instructeur
  let mail: { envoye: boolean; erreur?: string } | undefined;
  const modele = { ACCORD: 'MSG_TOURNAGE_ACCORD', COMPLEMENT: 'MSG_TOURNAGE_COMPLEMENT', REFUSEE: 'MSG_TOURNAGE_REFUS' }[data.statut as string];
  if (body.notifier && modele) {
    try {
      const cfg = await lireConfigTournage();
      const r = await envoyerMailTournage(modele, row.email, row, cfg, { MESSAGE: String(body.message || '').replace(/\n/g, '<br>') });
      mail = { envoye: !r.skipped, erreur: r.skipped ? 'Modèle désactivé' : undefined };
    } catch (e: any) {
      mail = { envoye: false, erreur: e.message };
    }
  }
  return NextResponse.json({ ...row, mail });
}
