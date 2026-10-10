import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';

// Logo de la ville (en haut à gauche de l'application). Stocké dans public/uploads (volume Docker persistant).
const DIR = join(process.cwd(), 'public', 'uploads', 'branding');
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' };

function trouver(): string | null {
  if (!existsSync(DIR)) return null;
  const f = readdirSync(DIR).find((n) => n.startsWith('logo-ville.'));
  return f ? join(DIR, f) : null;
}

// GET → l'image du logo (repli sur le logo par défaut). ?info=1 → { custom, version }
export async function GET(req: NextRequest) {
  const fichier = trouver();
  if (req.nextUrl.searchParams.get('info')) {
    const v = fichier ? (await stat(fichier)).mtimeMs : 0;
    return NextResponse.json({ custom: !!fichier, version: Math.round(v) });
  }
  const chemin = fichier || join(process.cwd(), 'public', 'logo.png');
  try {
    const buf = await readFile(chemin);
    const ext = chemin.split('.').pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': TYPES[ext] || 'image/png', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'MANAGE_USERS')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!TYPES[ext]) return NextResponse.json({ error: 'Format non supporté (PNG, JPG, SVG ou WebP)' }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop volumineux (2 Mo max)' }, { status: 400 });
  await mkdir(DIR, { recursive: true });
  const ancien = trouver();
  if (ancien) await unlink(ancien).catch(() => {});
  await writeFile(join(DIR, `logo-ville.${ext}`), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'MANAGE_USERS')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const ancien = trouver();
  if (ancien) await unlink(ancien).catch(() => {});
  return NextResponse.json({ success: true });
}
