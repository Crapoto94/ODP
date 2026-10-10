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
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('[TOURNAGES LISTE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
