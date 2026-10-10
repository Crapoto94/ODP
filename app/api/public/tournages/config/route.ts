import { NextResponse } from 'next/server';
import { lireConfigTournage, reglesDe, verifierCleApi, TYPES_FILM } from '@/lib/tournage-service';
import { premiereDatePossible, iso } from '@/lib/tournage-regles';

// Règles publiques consommées par le frontend de dépôt (DMZ). Authentifié par clé API.
export async function GET(req: Request) {
  if (!(await verifierCleApi(req))) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 });
  const row = await lireConfigTournage();
  const regles = reglesDe(row);
  const { date, periode } = premiereDatePossible(new Date(), regles);
  return NextResponse.json({
    actif: row.actif,
    messageAccueil: row.messageAccueil || null,
    delaiInstruction: regles.delaiInstruction,
    typeJours: regles.typeJours,
    periodesAbsence: regles.periodesAbsence,
    premiereDatePossible: iso(date),
    periodeEnCours: periode,
    typesFilm: TYPES_FILM,
  });
}
