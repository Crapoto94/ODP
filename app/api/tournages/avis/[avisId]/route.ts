import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { lireConfigTournage } from '@/lib/tournage-service';
import { relancerAvis } from '@/lib/tournage-avis';

// { action: 'relancer' | 'annuler' }
export async function PATCH(req: Request, { params }: { params: Promise<{ avisId: string }> }) {
  const s = await getSession();
  if (!s || !hasPermissionServer(s.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { avisId } = await params;
  try {
    const db = prisma as any;
    const avis = await db.avisTournage.findUnique({ where: { id: Number(avisId) } });
    if (!avis) return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    const { action } = await req.json();
    if (action === 'annuler') {
      return NextResponse.json(await db.avisTournage.update({ where: { id: avis.id }, data: { statut: 'ANNULE' } }));
    }
    if (action === 'relancer') {
      if (avis.statut !== 'EN_ATTENTE') return NextResponse.json({ error: 'Seul un avis sans retour peut être relancé' }, { status: 400 });
      const demande = await db.demandeTournage.findUnique({ where: { id: avis.demandeId } });
      await relancerAvis(avis, demande, await lireConfigTournage());
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
