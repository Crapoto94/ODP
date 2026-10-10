import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { lireConfigTournage } from '@/lib/tournage-service';
import { simulerDemande } from '@/lib/tournage-simulation-db';

async function autorise() {
  const s = await getSession();
  return s && hasPermissionServer(s.role, 'VIEW_TOURNAGES') ? s : null;
}

// Simulation financière de la demande (barèmes de la Ville) avec les surcharges enregistrées
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await autorise())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    const d = await (prisma as any).demandeTournage.findUnique({ where: { id: Number(id) } });
    if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    const cfg = await lireConfigTournage();
    return NextResponse.json(await simulerDemande(d, cfg.simulation));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// Recalcule avec des surcharges et les enregistre sur la demande : { surcharges: { abattement, gratuit, typeLieu, equipement, surfaceM2, cablesM, instructionHeures } }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await autorise())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    const db = prisma as any;
    const d = await db.demandeTournage.findUnique({ where: { id: Number(id) } });
    if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    const { surcharges = {} } = await req.json();
    const propres: any = {};
    if (['AUTO', 'OUI', 'NON'].includes(surcharges.abattement)) propres.abattement = surcharges.abattement;
    if (['AUTO', 'OUI', 'NON'].includes(surcharges.gratuit)) propres.gratuit = surcharges.gratuit;
    if (['VOIE', 'ESPACE_VERT', 'BATIMENT', 'SPORT'].includes(surcharges.typeLieu)) propres.typeLieu = surcharges.typeLieu;
    if (['piscine', 'gymnase', 'salle_sport', 'stade', 'tennis', 'plateau'].includes(surcharges.equipement)) propres.equipement = surcharges.equipement;
    for (const k of ['surfaceM2', 'cablesM', 'instructionHeures']) { const v = Number(surcharges[k]); if (surcharges[k] !== '' && surcharges[k] != null && v >= 0) propres[k] = v; }
    const maj = await db.demandeTournage.update({ where: { id: d.id }, data: { donnees: { ...(d.donnees || {}), simulationSurcharges: propres } } });
    const cfg = await lireConfigTournage();
    return NextResponse.json(await simulerDemande(maj, cfg.simulation));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
