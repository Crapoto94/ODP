/**
 * Regles de tarification TLPE partagees entre le client et le serveur.
 *
 * Regle metier (enseignes) : le tarif au m² ne s'applique pas enseigne par
 * enseigne mais sur la SURFACE CUMULEE de toutes les enseignes du dossier.
 * Exemple : un dossier avec 3 enseignes de 20 m² (60 m² cumules) applique le
 * tarif "> 50 m²" a chacune des 3 lignes, meme si aucune ne depasse 50 m².
 *
 * Les dispositifs non-numeriques et numeriques restent, eux, tarifes sur la
 * surface de leur propre ligne.
 */

import { R } from './regles-metier';

export const TLPE_SURFACE_SEUIL_M2 = 50; // valeur par défaut ; le seuil actif est la règle « tlpe.palier.seuilM2 »
const seuilPalier = () => R.num('tlpe.palier.seuilM2');

/**
 * Categories de dispositifs TLPE (Article.notes.tlpeType) :
 *  - ENSEIGNE       : enseigne ; comptee dans le cumul ET dans le seuil d'exoneration (12 m²) ;
 *  - ENSEIGNE_SOL   : enseigne scellee au sol ou installee directement sur le sol ; comptee dans le cumul qui fixe le palier
 *                     tarifaire (memes tarifs que les enseignes) mais JAMAIS exoneree et exclue du seuil d'exoneration (backlog #47) ;
 *  - NON_NUM / NUM  : dispositifs publicitaires non numeriques / numeriques (palier selon la surface de la ligne).
 */
export const TLPE_TYPE_LABELS: Record<string, string> = {
  ENSEIGNE: 'Enseigne',
  ENSEIGNE_SOL: 'Enseigne scellée au sol',
  NON_NUM: 'Pub. non numérique',
  NUM: 'Pub. numérique',
};

/** Vrai pour les categories qui suivent la grille « enseignes » (palier selon la surface cumulee). */
export const isEnseigneFamille = (t: string | undefined | null) => t === 'ENSEIGNE' || t === 'ENSEIGNE_SOL';

/** Surface retenue pour le SEUIL D'EXONERATION : enseignes ordinaires uniquement (hors scellees au sol), non proratisee. */
export function getSurfaceExoneration(lignes: any[] | null | undefined): number {
  return (lignes || []).reduce((sum, l) => (l.deletedAt || !typeSoumisExoneration(getTlpeType(l)) ? sum : sum + (Number(l.quantite1) || 0)), 0);
}

/** Types de dispositifs concernés par l'exoneration (enseignes ; les scellees au sol seulement si la regle « exclureScelleesSol » est desactivee). */
export function typeSoumisExoneration(type: string | undefined | null): boolean {
  return type === 'ENSEIGNE' || (type === 'ENSEIGNE_SOL' && !R.bool('tlpe.exoneration.exclureScelleesSol'));
}

/** Seuil d'exoneration (m²) : configuration TLPE de l'annee, sinon regle « tlpe.exoneration.seuilDefaut ». */
export function seuilExoneration(tlpeConfig: any): number {
  const v = Number(tlpeConfig?.exoneration);
  return Number.isFinite(v) && tlpeConfig?.exoneration != null ? v : R.num('tlpe.exoneration.seuilDefaut');
}

/** Les enseignes du dossier sont-elles exonerees (regle active et surface cumulee <= seuil) ? */
export function enseignesExonerees(lignes: any[] | null | undefined, tlpeConfig: any): boolean {
  if (!R.bool('tlpe.exoneration.actif')) return false;
  return getSurfaceExoneration(lignes) <= seuilExoneration(tlpeConfig);
}

/** Une ligne (ou un type) est-elle exoneree ? */
export const ligneExoneree = (typeOuLigne: any, enseignesExoneree: boolean): boolean =>
  enseignesExoneree && typeSoumisExoneration(typeof typeOuLigne === 'string' ? typeOuLigne : getTlpeType(typeOuLigne));

export type TlpeRefTarifs = {
  enseignes_12_50: number;
  enseignes_50_plus: number;
  pub_non_num_50_moins: number;
  pub_non_num_50_plus: number;
  pub_num_50_moins: number;
  pub_num_50_plus: number;
};

/**
 * Determine le type TLPE (ENSEIGNE / NON_NUM / NUM) d'un article ou d'une
 * ligne.
 *
 * Trois cas de figure coexistent en base :
 *  - articles du catalogue : `notes = { tlpeType, isCatalogue: true }`
 *  - articles de reference (grille tarifaire) : `notes = { isRef, refSlot }`
 *    -> utilises par l'import historique 2025, une ligne par tarif applique
 *  - lignes plus anciennes sans metadonnee, reconnues par leur libelle
 *
 * `article.notes` est tantot une chaine JSON (retour Prisma brut), tantot
 * deja parse dans `article.meta` (retour de /api/articles/tlpe).
 */
export function getTlpeType(articleOrLigne: any): string {
  const article = articleOrLigne?.article ?? articleOrLigne;
  if (!article) return '';

  if (article.meta?.tlpeType) return article.meta.tlpeType;

  let meta: any = {};
  try {
    meta = JSON.parse(article.notes || '{}');
  } catch {
    meta = {};
  }

  if (meta.tlpeType) return meta.tlpeType;

  // Articles de reference : le slot encode la famille.
  if (typeof meta.refSlot === 'string') {
    if (meta.refSlot.startsWith('enseignes_')) return 'ENSEIGNE';
    if (meta.refSlot.startsWith('pub_non_num_')) return 'NON_NUM';
    if (meta.refSlot.startsWith('pub_num_')) return 'NUM';
  }

  // Repli sur le libelle (cf. app/api/commerces/route.ts).
  return (article.designation || '').trim().toLowerCase().startsWith('enseigne') ? 'ENSEIGNE' : '';
}

/**
 * Prorata TLPE en MOIS PLEINS (regle de la facture PDF, du montant stocke et des lignes) :
 * un mois entame n'est pas facture (1er du mois suivant au debut, dernier jour du mois precedent a la fin).
 */
export function calculateTlpeProrata(startDate: Date, endDate: Date): { months: number; ratio: number } {
  const joursDuMois = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const mode = R.str('tlpe.prorata.mode');
  if (mode === 'ANNEE') return { months: 12, ratio: 1 };
  if (mode === 'JOURS') {
    const j0 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const j1 = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    if (j1 < j0) return { months: 0, ratio: 0 };
    const jours = Math.round((j1 - j0) / 86400000) + 1;
    const annee = startDate.getFullYear();
    const dansAnnee = (annee % 4 === 0 && (annee % 100 !== 0 || annee % 400 === 0)) ? 366 : 365;
    const ratio = Math.min(1, jours / dansAnnee);
    return { months: Math.round(ratio * 12), ratio };
  }
  if (mode === 'MOIS_ENTAMES') {
    const debutM = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const finM = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    if (finM < debutM) return { months: 0, ratio: 0 };
    const mois = (finM.getFullYear() - debutM.getFullYear()) * 12 + (finM.getMonth() - debutM.getMonth()) + 1;
    return { months: mois, ratio: mois / 12 };
  }
  let debut = new Date(startDate);
  if (debut.getDate() !== 1) debut = new Date(debut.getFullYear(), debut.getMonth() + 1, 1);
  let fin = new Date(endDate);
  if (fin.getDate() !== joursDuMois(fin)) fin = new Date(fin.getFullYear(), fin.getMonth(), 0);
  if (fin < debut) return { months: 0, ratio: 0 };
  const months = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth()) + 1;
  return { months, ratio: months / 12 };
}

/** Periode d'une ligne (dates constatees prioritaires) ; null = ouvert (toute l'annee). */
function periodeLigne(l: any): { debut: number; fin: number } {
  const t = (d: any) => { const v = d ? new Date(d).getTime() : NaN; return Number.isNaN(v) ? null : v; };
  return {
    debut: t(l?.dateDebutConstatee) ?? t(l?.dateDebut) ?? -Infinity,
    fin: t(l?.dateFinConstatee) ?? t(l?.dateFin) ?? Infinity,
  };
}

/**
 * Surface cumulee des enseignes d'un dossier.
 *
 * Regle : seules les enseignes presentes EN MEME TEMPS comptent. Une enseigne
 * supprimee en cours d'annee (date de fin) ne s'ajoute pas a la surface cumulee
 * d'une enseigne installee apres sa suppression (ex. supprimee fin mars,
 * remplacee en avril : pas de cumul). Sans `pour`, toutes les enseignes sont
 * cumulees (comportement historique).
 *
 * @param lignes        Lignes du dossier (celles soft-deleted sont ignorees)
 * @param excludeLigneId  Id de la ligne en cours d'edition (remplacee par
 *                        `surfaceRemplacee` pour ne pas la compter deux fois)
 * @param surfaceRemplacee Surface de la ligne en cours d'edition, si c'est
 *                        une enseigne (sinon 0)
 * @param pour          Periode (dateDebut/dateFin) de la ligne dont on cherche
 *                        le tarif : seules les enseignes qui la chevauchent comptent
 */
export function getEnseigneSurfaceCumulee(
  lignes: any[] | null | undefined,
  options: { excludeLigneId?: number | null; surfaceRemplacee?: number; pour?: { dateDebut?: any; dateFin?: any } | null } = {},
): number {
  const { excludeLigneId = null, surfaceRemplacee = 0, pour = null } = options;
  const cible = pour && R.bool('tlpe.enseignes.cumulSimultane') ? periodeLigne(pour) : null;

  const cumul = (lignes || []).reduce((sum, ligne) => {
    if (ligne.deletedAt) return sum;
    if (excludeLigneId != null && ligne.id === excludeLigneId) return sum;
    if (!isEnseigneFamille(getTlpeType(ligne))) return sum;
    if (cible) {
      const p = periodeLigne(ligne);
      if (p.debut > cible.fin || cible.debut > p.fin) return sum; // jamais presentes en meme temps
    }
    return sum + (Number(ligne.quantite1) || 0);
  }, 0);

  return cumul + (Number(surfaceRemplacee) || 0);
}

/**
 * Resout le tarif unitaire (€/m²) applicable a une ligne.
 *
 * @param surface        Surface de la ligne (m²)
 * @param cumulEnseignes Surface cumulee des enseignes du dossier (m²)
 */
export function resolveTlpeTarif(
  tlpeType: string | undefined | null,
  surface: number,
  cumulEnseignes: number,
  tarifs: TlpeRefTarifs | null | undefined,
): number {
  const slot = getTlpeSlotAttendu(tlpeType, surface, cumulEnseignes);
  return slot && tarifs ? tarifs[slot] : 0;
}

/** Les 6 paliers de la grille tarifaire TLPE. */
export type TlpeSlot = keyof TlpeRefTarifs;

const TLPE_SLOTS: TlpeSlot[] = [
  'enseignes_12_50',
  'enseignes_50_plus',
  'pub_non_num_50_moins',
  'pub_non_num_50_plus',
  'pub_num_50_moins',
  'pub_num_50_plus',
];

function isTlpeSlot(value: unknown): value is TlpeSlot {
  return typeof value === 'string' && (TLPE_SLOTS as string[]).includes(value);
}

/**
 * Palier tarifaire que DOIT porter une ligne TLPE :
 *  - enseignes : selon la surface CUMULEE du dossier ;
 *  - dispositifs non-numeriques / numeriques : selon la surface de la ligne.
 * Retourne null si le type est inconnu.
 */
export function getTlpeSlotAttendu(
  tlpeType: string | undefined | null,
  surface: number,
  cumulEnseignes: number,
): TlpeSlot | null {
  const seuil = seuilPalier();
  const plus = surface > seuil;
  if (isEnseigneFamille(tlpeType)) {
    const base = R.bool('tlpe.enseignes.cumul') ? cumulEnseignes : surface;
    return base <= seuil ? 'enseignes_12_50' : 'enseignes_50_plus';
  }
  if (tlpeType === 'NON_NUM') {
    return plus ? 'pub_non_num_50_plus' : 'pub_non_num_50_moins';
  }
  if (tlpeType === 'NUM') {
    return plus ? 'pub_num_50_plus' : 'pub_num_50_moins';
  }
  return null;
}

/** Vrai si l'article porte la metadonnee `isRef` (article de la grille). */
export function isTlpeRefArticle(articleOrLigne: any): boolean {
  const article = articleOrLigne?.article ?? articleOrLigne;
  if (!article) return false;
  if (article.meta?.isRef) return true;
  try {
    return JSON.parse(article.notes || '{}').isRef === true;
  } catch {
    return false;
  }
}

/**
 * Determine le palier tarifaire actuellement porte par une ligne :
 *  - articles de reference : le `refSlot` est explicite ;
 *  - articles du catalogue / anciens : le montant est compare a la grille ;
 *  - en dernier recours : le libelle.
 *
 * Sert a ne corriger une ligne que si son palier est faux (on ne "normalise"
 * pas les tarifs historiques deja dans le bon palier).
 */
export function getTlpeSlotCourant(
  ligne: any,
  tarifs: TlpeRefTarifs | null | undefined,
): TlpeSlot | null {
  const article = ligne?.article ?? ligne;
  if (!article) return null;

  let meta: any = article.meta || {};
  if (!meta.refSlot) {
    try {
      meta = { ...meta, ...JSON.parse(article.notes || '{}') };
    } catch {
      /* notes non JSON */
    }
  }
  if (isTlpeSlot(meta.refSlot)) return meta.refSlot;

  const type = getTlpeType(ligne);
  const familySlots: TlpeSlot[] | null =
    isEnseigneFamille(type) ? ['enseignes_12_50', 'enseignes_50_plus'] :
    type === 'NON_NUM' ? ['pub_non_num_50_moins', 'pub_non_num_50_plus'] :
    type === 'NUM' ? ['pub_num_50_moins', 'pub_num_50_plus'] : null;

  // Comparaison du montant a la grille de l'annee (restreinte a la famille,
  // car deux familles peuvent partager le meme tarif, ex. 66 EUR en 2025).
  const montant = Number(ligne?.montant ?? article.montant) || 0;
  if (tarifs && familySlots) {
    const matched = familySlots.find((s) => Math.abs(montant - tarifs[s]) < 0.005);
    if (matched) return matched;
  }

  // Repli sur le libelle.
  const d = (article.designation || '').trim().toLowerCase();
  const plus = d.includes('>') || d.includes('plus');
  if (d.startsWith('enseigne')) {
    return plus ? 'enseignes_50_plus' : 'enseignes_12_50';
  }
  if (d.startsWith('dispositif') || d.startsWith('publicit') || d.startsWith('panneau')) {
    const nonNum = d.includes('non');
    if (nonNum) return plus ? 'pub_non_num_50_plus' : 'pub_non_num_50_moins';
    return plus ? 'pub_num_50_plus' : 'pub_num_50_moins';
  }

  return null;
}


/**
 * Quantite 2 (duree facturee) d'une ligne selon l'unite de temps du mode de taxation, soumise aux regles de duree :
 * jour de debut et de fin inclus, taille du mois, tranche « 10 jours », dates constatees prioritaires.
 */
export function calculateQ2(u2: string, start: Date | null, end: Date | null, startC: Date | null, endC: Date | null) {
  const priorite = R.bool('duree.constateesPrioritaires');
  const s = priorite ? (startC || start) : (start || startC);
  const e = priorite ? (endC || end) : (end || endC);
  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;

  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + (R.bool('duree.jourInclusif') ? 1 : 0);

  const unit = (u2 || '').toLowerCase();

  if (unit.includes('an')) return 1;
  if (unit.includes('10 jour')) return Math.max(1, Math.ceil(diffDays / R.num('duree.trancheJours')));
  if (unit.includes('mois')) return Math.max(1, Math.ceil(diffDays / R.num('duree.moisJours')));
  if (unit.includes('jour') || unit.includes('nuit')) return Math.max(1, diffDays);

  return 1;
}
