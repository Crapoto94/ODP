import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function removePublicFile(relPath: string | null | undefined) {
  if (!relPath || !relPath.startsWith('/')) return;
  try {
    const abs = join(process.cwd(), 'public', relPath.replace(/^\//, ''));
    if (existsSync(abs)) await unlink(abs);
  } catch (e) {
    console.warn('[autorisation] Could not delete file', relPath, e);
  }
}

// PATCH: met à jour une autorisation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const {
      libelle,
      gabaritId,
      dateDebut,
      dateFin,
      ligneIds,
      signed,
      dateSignature,
      finalPath,
      ordre,
    } = body;

    const data: any = {
      ...(libelle !== undefined && { libelle }),
      ...(gabaritId !== undefined && { gabaritId: gabaritId ? parseInt(gabaritId) : null }),
      ...(dateDebut !== undefined && { dateDebut: dateDebut ? new Date(dateDebut) : null }),
      ...(dateFin !== undefined && { dateFin: dateFin ? new Date(dateFin) : null }),
      ...(ligneIds !== undefined && { ligneIds: ligneIds ? JSON.stringify(ligneIds) : null }),
      ...(signed !== undefined && { signed: !!signed }),
      ...(dateSignature !== undefined && { dateSignature: dateSignature ? new Date(dateSignature) : null }),
      ...(finalPath !== undefined && { finalPath }),
      ...(ordre !== undefined && { ordre: parseInt(ordre) }),
    };

    const updated = await (prisma as any).autorisation.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH autorisation]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: supprime une autorisation + ses fichiers disque
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const autorisationId = parseInt(id);

    const existing = await (prisma as any).autorisation.findUnique({ where: { id: autorisationId } });
    if (existing) {
      await removePublicFile(existing.generatedPath);
      await removePublicFile(existing.generatedPdf);
      await removePublicFile(existing.finalPath);
    }

    await (prisma as any).autorisation.delete({ where: { id: autorisationId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE autorisation]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
