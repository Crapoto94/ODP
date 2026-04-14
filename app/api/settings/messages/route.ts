import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — retourne tous les messages contextuels en DB
export async function GET() {
  try {
    const rows = await (prisma as any).$queryRaw`SELECT id, cle, label, sujet, valeur, disabled FROM ContextualMessage`;
    // SQLite renvoie disabled comme 0/1 — normaliser en boolean
    const normalized = (rows as any[]).map(r => ({ ...r, disabled: !!r.disabled }));
    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — crée ou met à jour un message (valeur + label + disabled optionnels)
export async function PUT(req: Request) {
  try {
    const { cle, valeur, label, sujet, disabled } = await req.json();
    if (!cle || valeur === undefined) {
      return NextResponse.json({ error: 'cle et valeur requis' }, { status: 400 });
    }

    const existing = await (prisma as any).$queryRaw`
      SELECT id FROM ContextualMessage WHERE cle = ${cle}
    `;

    const disabledVal = disabled ? 1 : 0;

    if ((existing as any[]).length > 0) {
      await (prisma as any).$executeRaw`
        UPDATE ContextualMessage SET valeur = ${valeur}, label = ${label ?? null}, sujet = ${sujet ?? null}, disabled = ${disabledVal} WHERE cle = ${cle}
      `;
    } else {
      await (prisma as any).$executeRaw`
        INSERT INTO ContextualMessage (cle, label, sujet, valeur, disabled) VALUES (${cle}, ${label ?? null}, ${sujet ?? null}, ${valeur}, ${disabledVal})
      `;
    }

    const rows = await (prisma as any).$queryRaw`
      SELECT id, cle, label, sujet, valeur, disabled FROM ContextualMessage WHERE cle = ${cle}
    `;
    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — met à jour seulement le label ou le disabled (sans toucher au valeur)
export async function PATCH(req: Request) {
  try {
    const { cle, label, disabled } = await req.json();
    if (!cle) return NextResponse.json({ error: 'cle requis' }, { status: 400 });

    const existing = await (prisma as any).$queryRaw`
      SELECT id, valeur FROM ContextualMessage WHERE cle = ${cle}
    `;

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Message non trouvé en DB' }, { status: 404 });
    }

    if (label !== undefined && disabled !== undefined) {
      const disabledVal = disabled ? 1 : 0;
      await (prisma as any).$executeRaw`
        UPDATE ContextualMessage SET label = ${label ?? null}, disabled = ${disabledVal} WHERE cle = ${cle}
      `;
    } else if (label !== undefined) {
      await (prisma as any).$executeRaw`
        UPDATE ContextualMessage SET label = ${label ?? null} WHERE cle = ${cle}
      `;
    } else if (disabled !== undefined) {
      const disabledVal = disabled ? 1 : 0;
      await (prisma as any).$executeRaw`
        UPDATE ContextualMessage SET disabled = ${disabledVal} WHERE cle = ${cle}
      `;
    }

    const rows = await (prisma as any).$queryRaw`
      SELECT id, cle, label, valeur, disabled FROM ContextualMessage WHERE cle = ${cle}
    `;
    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — supprime un message de la DB (revient au défaut)
export async function DELETE(req: NextRequest) {
  try {
    const cle = req.nextUrl.searchParams.get('cle');
    if (!cle) return NextResponse.json({ error: 'cle requis' }, { status: 400 });
    await (prisma as any).$executeRaw`DELETE FROM ContextualMessage WHERE cle = ${cle}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
