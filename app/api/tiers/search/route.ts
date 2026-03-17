import { NextResponse } from 'next/server';
import { fetchSiretInfo } from '@/lib/insee';

function mapNatureJuridique(apiNature: string): string {
  if (!apiNature) return '';
  const nature = apiNature.toLowerCase();
  
  if (nature.includes('entrepreneur individuel') || nature.includes('libérale') || nature.includes('professions libérales')) {
    return 'AUTO_ENTREPRENEUR';
  }
  if (nature.includes('société') || nature.includes('arl') || nature.includes('sas') || nature.includes('sasu') || nature.includes('eurl') || nature.includes('sa')) {
    return 'SOCIETE';
  }
  if (nature.includes('association')) {
    return 'ASSOCIATION';
  }
  if (nature.includes('public') || nature.includes('mairie') || nature.includes('collectivité') || nature.includes('administration') || nature.includes('commune') || nature.includes('etat')) {
    return 'PUBLIC';
  }
  
  return ''; // Fallback to empty if no clear match
}

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

  return NextResponse.json({
    ...info,
    natureJuridique: info.categorie_juridique ? mapNatureJuridique(info.categorie_juridique) : ''
  });
}
