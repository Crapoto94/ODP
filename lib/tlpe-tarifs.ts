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

export const TLPE_SURFACE_SEUIL_M2 = 50;

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
 * Surface cumulee des enseignes d'un dossier.
 *
 * @param lignes        Lignes du dossier (celles soft-deleted sont ignorees)
 * @param excludeLigneId  Id de la ligne en cours d'edition (remplacee par
 *                        `surfaceRemplacee` pour ne pas la compter deux fois)
 * @param surfaceRemplacee Surface de la ligne en cours d'edition, si c'est
 *                        une enseigne (sinon 0)
 */
export function getEnseigneSurfaceCumulee(
  lignes: any[] | null | undefined,
  options: { excludeLigneId?: number | null; surfaceRemplacee?: number } = {},
): number {
  const { excludeLigneId = null, surfaceRemplacee = 0 } = options;

  const cumul = (lignes || []).reduce((sum, ligne) => {
    if (ligne.deletedAt) return sum;
    if (excludeLigneId != null && ligne.id === excludeLigneId) return sum;
    if (getTlpeType(ligne) !== 'ENSEIGNE') return sum;
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
  const plus = surface > TLPE_SURFACE_SEUIL_M2;
  if (tlpeType === 'ENSEIGNE') {
    return cumulEnseignes <= TLPE_SURFACE_SEUIL_M2 ? 'enseignes_12_50' : 'enseignes_50_plus';
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
    type === 'ENSEIGNE' ? ['enseignes_12_50', 'enseignes_50_plus'] :
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
