import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { lireConfigTournage } from '@/lib/tournage-service';

async function admin() {
  const s = await getSession();
  return s && hasPermissionServer(s.role, 'MANAGE_USERS') ? s : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try { return NextResponse.json(await lireConfigTournage()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    const b = await req.json();
    await lireConfigTournage();
    const data: any = {};
    if (b.actif !== undefined) data.actif = !!b.actif;
    if (b.delaiInstruction !== undefined) data.delaiInstruction = Math.max(0, Math.min(365, parseInt(b.delaiInstruction) || 0));
    if (b.typeJours !== undefined) data.typeJours = b.typeJours === 'CALENDAIRES' ? 'CALENDAIRES' : 'OUVRES';
    if (b.exclureFeries !== undefined) data.exclureFeries = !!b.exclureFeries;
    if (b.delaiMinimalDepot !== undefined) data.delaiMinimalDepot = Math.max(0, parseInt(b.delaiMinimalDepot) || 0);
    if (b.messageAccueil !== undefined) data.messageAccueil = b.messageAccueil || null;
    if (b.emailNotification !== undefined) data.emailNotification = b.emailNotification || null;
    if (Array.isArray(b.periodesAbsence)) {
      data.periodesAbsence = b.periodesAbsence
        .filter((p: any) => p?.debut && p?.fin && p?.reprise)
        .map((p: any) => ({ debut: p.debut, fin: p.fin, reprise: p.reprise, motif: p.motif || '' }));
    }
    if (b.regenererCle) data.apiKey = randomBytes(24).toString('hex');
    return NextResponse.json(await (prisma as any).tournageConfig.update({ where: { id: 1 }, data }));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
