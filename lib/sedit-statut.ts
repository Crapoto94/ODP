import { prisma } from './prisma';
import { R } from './regles-metier';
import { chargerRegles } from './regles-metier-server';
import type { TitrePaiement } from './sedit-paiement';

// Synchronise le statut des dossiers avec le titre SEDIT retrouvé pour leur facture :
//   titre payé            → CLOS  (dateCLOS = date de paiement, dateTITRE complétée si vide)
//   titre émis, non payé  → TITRE (dateTITRE = date du titre) — seulement depuis « Facturé »
// Le statut n'avance jamais en sens inverse ; un titre rejeté, suspendu ou annulé en totalité ne change rien.
// Une facture (commerce / TLPE) peut couvrir plusieurs dossiers : on se base sur occupation.numeroFacture.
const FACTURE = ['FACTURE', 'FACTURÉ', 'INVOICED'];
const TITRE = ['TITRE', 'TITRÉ'];

export interface ChangementStatut { numero: string; dossiers: number; de: string; vers: 'TITRE' | 'CLOS' }

export async function synchroniserStatuts(resultats: TitrePaiement[], auteur = 'Système (SEDIT)'): Promise<ChangementStatut[]> {
  const changements: ChangementStatut[] = [];
  await chargerRegles();

  for (const r of resultats) {
    if (r.confiance !== 'exact' || r.annule || !r.etat) continue;
    const cible: 'TITRE' | 'CLOS' | null = r.etat === 'paye' ? 'CLOS' : (r.etat === 'a_payer' || r.etat === 'non_pris_en_charge') ? 'TITRE' : null;
    if (!cible) continue;
    // Règles « statut.sedit.clos » et « statut.sedit.titre »
    if (cible === 'CLOS' && !R.bool('statut.sedit.clos')) continue;
    if (cible === 'TITRE' && !R.bool('statut.sedit.titre')) continue;

    const eligibles = cible === 'CLOS' ? [...FACTURE, ...TITRE] : FACTURE;
    const occs = await (prisma as any).occupation.findMany({
      where: { numeroFacture: r.numero, statut: { in: eligibles } },
      select: { id: true, statut: true, anneeTaxation: true, dateTITRE: true },
    });
    if (!occs.length) continue;

    const titreDate = r.titreDate ? new Date(r.titreDate) : new Date();
    const paiementDate = r.paiementLe ? new Date(r.paiementLe) : new Date();

    for (const o of occs) {
      const accent = String(o.statut).includes('É'); // conserve la graphie du dossier (commerces : « TITRÉ »)
      const statut = accent && cible === 'TITRE' ? 'TITRÉ' : cible;
      await (prisma as any).occupation.update({
        where: { id: o.id },
        data: {
          statut,
          ...(cible === 'CLOS' ? { dateCLOS: paiementDate } : {}),
          ...(!o.dateTITRE ? { dateTITRE: titreDate } : {}),
        },
      });
      const year = o.anneeTaxation || new Date().getFullYear();
      const detail = cible === 'CLOS'
        ? `titre n°${r.titreNumero} payé le ${paiementDate.toLocaleDateString('fr-FR')}`
        : `titre n°${r.titreNumero} émis le ${titreDate.toLocaleDateString('fr-FR')}`;
      await (prisma as any).note.create({
        data: {
          occupationId: o.id,
          content: `📊 Passage de statut : ${o.statut} → ${statut} (${year}) — ${detail} dans SEDIT`,
          author: auteur,
          isEmail: false,
          origin: 'desktop',
          created_at: new Date().toISOString(),
        },
      });
    }
    changements.push({ numero: r.numero, dossiers: occs.length, de: occs[0].statut, vers: cible });
  }
  return changements;
}
