import { NextResponse } from 'next/server';
import { fetchSiretInfo } from '@/lib/insee';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siret = searchParams.get('siret');

  if (!siret) {
    return NextResponse.json({ error: 'SIRET requis' }, { status: 400 });
  }

  const info = await fetchSiretInfo(siret);
  if (!info) {
    return NextResponse.json({ error: 'SIRET non trouvé ou erreur INSEE' }, { status: 404 });
  }

  return NextResponse.json(info);
}
