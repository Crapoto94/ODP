import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { assurerTablesTournage } from '@/lib/tournage-service';

// Liste des demandes de tournage (gestion métier)
export async function GET() {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    await assurerTablesTournage();
    const rows = await (prisma as any).demandeTournage.findMany({
      orderBy: { dateDepot: 'desc' },
      select: { id: true, reference: true, statut: true, dateDepot: true, dateLimiteReponse: true, premiereDate: true, derniereDate: true, societe: true, demandeurNom: true, email: true, telephone: true, titre: true, typeFilm: true, occupationId: true, pieces: true },
    });
    // Synthèse des avis des services par demande (hors avis annulés)
    const avis = await (prisma as any).avisTournage.findMany({ where: { statut: { not: 'ANNULE' } }, select: { demandeId: true, serviceNom: true, statut: true, dateReponse: true, dateDemande: true }, orderBy: { dateDemande: 'asc' } });
    const parDemande = new Map<number, any[]>();
    for (const a of avis) { const l = parDemande.get(a.demandeId) || []; l.push(a); parDemande.set(a.demandeId, l); }
    return NextResponse.json(rows.map((r: any) => ({ ...r, avis: parDemande.get(r.id) || [] })));
  } catch (e: any) {
    console.error('[TOURNAGES LISTE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
