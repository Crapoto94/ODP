import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { lirePieceTitre } from '@/lib/sedit-pj';

// GET ?titre=<ROO du titre de réduction>&nom=<NOM_PJ> → PDF du CA affiché dans le navigateur.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const titre = req.nextUrl.searchParams.get('titre') || '';
  const nom = req.nextUrl.searchParams.get('nom') || '';
  if (!/^\d{10,40}$/.test(titre) || !nom) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  try {
    const piece = await lirePieceTitre(titre, nom);
    if (!piece) return NextResponse.json({ error: 'Pièce introuvable dans SEDIT' }, { status: 404 });
    return new NextResponse(new Uint8Array(piece.buffer), {
      headers: { 'Content-Type': piece.mime, 'Content-Disposition': `inline; filename="${encodeURIComponent(piece.nom)}"`, 'Cache-Control': 'private, max-age=300' },
    });
  } catch (e: any) {
    console.error('[SEDIT PJ]', e);
    return NextResponse.json({ error: `Lecture du partage SEDIT impossible : ${e.code || e.message}` }, { status: 502 });
  }
}
