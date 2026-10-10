import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { cheminPiece } from '@/lib/tournage-fichiers';

const TYPES: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// Pièce jointe d'une demande de tournage : réservée aux utilisateurs ayant accès aux demandes
export async function GET(_req: Request, { params }: { params: Promise<{ ref: string; file: string }> }) {
  const s = await getSession();
  if (!s || !hasPermissionServer(s.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { ref, file } = await params;
  const chemin = cheminPiece(ref, file);
  if (!chemin) return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  const buf = await readFile(chemin);
  const ext = file.split('.').pop()!.toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Content-Disposition': `inline; filename="${ref}-${file.slice(0, 8)}.${ext}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
