import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { assurerTablesTournage } from '@/lib/tournage-service';
import { parseEmails } from '@/lib/tournage-avis';

// Services consultés pour avis (paramétrage : adresses e-mail, questions propres au service)
export async function GET() {
  const s = await getSession();
  if (!s || !hasPermissionServer(s.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    await assurerTablesTournage();
    return NextResponse.json(await (prisma as any).serviceInstructeur.findMany({ orderBy: [{ ordre: 'asc' }, { id: 'asc' }] }));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// Remplace la liste : { services: [{ id?, code, nom, description, emails, questions, circuitPropre, actif }] }
export async function PUT(req: Request) {
  const s = await getSession();
  if (!s || !(hasPermissionServer(s.role, 'MANAGE_USERS') || hasPermissionServer(s.role, 'MANAGE_TOURNAGES'))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    await assurerTablesTournage();
    const { services } = await req.json();
    if (!Array.isArray(services)) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    const db = prisma as any;
    const gardes: number[] = [];
    for (const [i, sv] of services.entries()) {
      const nom = String(sv.nom || '').trim();
      if (!nom) return NextResponse.json({ error: `Le service n°${i + 1} n'a pas de nom` }, { status: 400 });
      const code = String(sv.code || nom).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 30) || `SVC_${i + 1}`;
      const questions = (Array.isArray(sv.questions) ? sv.questions : [])
        .filter((q: any) => q?.libelle && String(q.libelle).trim())
        .map((q: any, k: number) => ({ id: String(q.id || `q${k + 1}`).replace(/[^a-zA-Z0-9_]/g, '_'), libelle: String(q.libelle).trim(), type: q.type === 'TEXTE' ? 'TEXTE' : 'OUINON' }));
      const data = { code, nom, description: sv.description || null, emails: parseEmails(sv.emails), questions, circuitPropre: !!sv.circuitPropre, actif: sv.actif !== false, ordre: i };
      const row = sv.id
        ? await db.serviceInstructeur.update({ where: { id: Number(sv.id) }, data })
        : await db.serviceInstructeur.create({ data });
      gardes.push(row.id);
    }
    await db.serviceInstructeur.deleteMany({ where: { id: { notIn: gardes } } });
    return NextResponse.json(await db.serviceInstructeur.findMany({ orderBy: [{ ordre: 'asc' }, { id: 'asc' }] }));
  } catch (e: any) {
    const doublon = e.code === 'P2002';
    return NextResponse.json({ error: doublon ? 'Deux services ont le même code' : e.message }, { status: doublon ? 400 : 500 });
  }
}
