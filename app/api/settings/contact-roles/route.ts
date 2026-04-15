import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rows = await (prisma as any).$queryRaw`
    SELECT id, nom, isSendAot, ordre FROM ContactRoleConfig ORDER BY ordre ASC, nom ASC
  `;
  return NextResponse.json((rows as any[]).map(r => ({ ...r, isSendAot: !!r.isSendAot })));
}

export async function POST(req: Request) {
  const { nom, isSendAot, ordre } = await req.json();
  if (!nom?.trim()) return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  const now = new Date().toISOString();
  const sendAot = isSendAot ? 1 : 0;
  const ordreVal = ordre ?? 0;
  await (prisma as any).$executeRaw`
    INSERT INTO ContactRoleConfig (nom, isSendAot, ordre, created_at, updated_at)
    VALUES (${nom.trim()}, ${sendAot}, ${ordreVal}, ${now}, ${now})
  `;
  const rows = await (prisma as any).$queryRaw`
    SELECT id, nom, isSendAot, ordre FROM ContactRoleConfig WHERE nom = ${nom.trim()} LIMIT 1
  `;
  return NextResponse.json({ ...((rows as any[])[0]), isSendAot: !!(rows as any[])[0]?.isSendAot });
}

export async function PUT(req: Request) {
  const { id, nom, isSendAot, ordre } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  const now = new Date().toISOString();
  const sendAot = isSendAot ? 1 : 0;
  await (prisma as any).$executeRaw`
    UPDATE ContactRoleConfig SET nom = ${nom}, isSendAot = ${sendAot}, ordre = ${ordre ?? 0}, updated_at = ${now}
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  await (prisma as any).$executeRaw`DELETE FROM ContactRoleConfig WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ success: true });
}
