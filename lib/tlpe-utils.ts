import { prisma } from './prisma';
import { R } from './regles-metier';
import { chargerRegles } from './regles-metier-server';
import {
  getTlpeSlotAttendu,
  getTlpeSlotCourant,
  getEnseigneSurfaceCumulee,
  getSurfaceExoneration,
  getTlpeType,
  isTlpeRefArticle,
  calculateTlpeProrata,
  seuilExoneration,
  enseignesExonerees,
  ligneExoneree,
  type TlpeRefTarifs,
} from './tlpe-tarifs';

/**
 * Recalcule le montant total d'une occupation en tenant compte des règles spécifiques du TLPE
 * (Prorata temporis et Exonération globale pour les Enseignes).
 * Met à jour le champ montantCalcule en base de données.
 */
export async function updateOccupationTotal(occupationId: number) {
  try {
    await chargerRegles();
    // 1. Récupérer l'occupation avec ses lignes et articles
    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        lignes: {
          include: {
            article: { include: { modeTaxation: true } }
          }
        }
      }
    });

    if (!occupation) return 0;

    // Pour les dossiers RODP classiques, le calcul reste simple (somme des lignes)
    if (occupation.type !== 'TLPE') {
      let total = occupation.lignes
        .filter((l: any) => !l.deletedAt)
        .reduce((sum: number, l: any) => sum + (l.montant || 0), 0);
      
      // Minoration court-métrage (règles « tournage.courtMetrage.* »)
      if (occupation.type === 'TOURNAGE' && occupation.isCourtMetrage && R.bool('tournage.courtMetrage.actif')) {
        total = total * (1 - R.num('tournage.courtMetrage.taux') / 100);
      }

      await (prisma as any).occupation.update({
        where: { id: occupationId },
        data: { montantCalcule: total }
      });
      return total;
    }

    // 2. Logique spécifique TLPE
    const anneeTaxation = occupation.anneeTaxation || (occupation.dateDebut ? new Date(occupation.dateDebut).getFullYear() : new Date().getFullYear());
    
    // Récupérer le seuil d'exonération pour l'année (via queryRaw car le modèle TlpeConfig peut être instable dans le client)
    let config: any = null;
    try {
      config = await (prisma as any).tlpeConfig.findFirst({
        where: { annee: anneeTaxation },
        select: { exoneration: true }
      });
    } catch (e: any) {
      console.error('Erreur récupération TlpeConfig:', e?.message || e);
    }

    // Calculer la surface totale des ENSEIGNES pour l'exonération globale
    // Surface cumulee COMPLETE (hors lignes supprimees), non proratisee : une enseigne ajoutee en cours d'annee
    // s'ajoute a la surface existante. getTlpeType reconnait aussi les articles de reference (sans notes.tlpeType).
    const isEnseigneExempt = enseignesExonerees(occupation.lignes, config);

    // Calcul du montant total Net
    const netTotal = occupation.lignes.reduce((sum: number, l: any) => {
      const tlpeType = getTlpeType(l);

      const d1 = new Date(l.dateDebut || `${anneeTaxation}-01-01`);
      const d2 = new Date(l.dateFin || `${anneeTaxation}-12-31`);
      const prorata = calculateTlpeProrata(d1, d2).ratio;

      // Si c'est une enseigne et qu'on est sous le seuil -> 0€
      if (ligneExoneree(tlpeType, isEnseigneExempt)) return sum;

      // Sinon : Tarif * Surface * Prorata (basé sur les mois pleins)
      return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
    }, 0);

    // 3. Mise à jour de la base de données
    await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: { montantCalcule: netTotal }
    });

    return netTotal;
  } catch (error: any) {
    console.error(`Erreur updateOccupationTotal for ID ${occupationId}:`, error?.message || error);
    return 0;
  }
}

/**
 * Charge la grille tarifaire de reference d'une annee : les 6 "slots"
 * enregistres dans Article.notes sous categorieId=30, avec l'id de l'article
 * de reference correspondant (utile pour reparenter une ligne enseignes).
 */
export async function getTlpeGrille(annee: number): Promise<{
  tarifs: TlpeRefTarifs;
  articleIdBySlot: Partial<Record<keyof TlpeRefTarifs, number>>;
}> {
  const tarifs: TlpeRefTarifs = {
    enseignes_12_50: 0,
    enseignes_50_plus: 0,
    pub_non_num_50_moins: 0,
    pub_non_num_50_plus: 0,
    pub_num_50_moins: 0,
    pub_num_50_plus: 0,
  };
  const articleIdBySlot: Partial<Record<keyof TlpeRefTarifs, number>> = {};

  const articles = await (prisma as any).article.findMany({ where: { categorieId: 30 } });
  for (const a of articles) {
    let meta: any = {};
    try { meta = JSON.parse(a.notes || '{}'); } catch (e) {}
    if (meta.isRef === true && meta.annee === annee && meta.refSlot in tarifs) {
      tarifs[meta.refSlot as keyof TlpeRefTarifs] = a.montant || 0;
      articleIdBySlot[meta.refSlot as keyof TlpeRefTarifs] = a.id;
    }
  }

  return { tarifs, articleIdBySlot };
}

/**
 * Re-applique les tarifs TLPE a toutes les lignes du dossier :
 *  - enseignes : tarif au m² base sur la surface CUMULEE du dossier ;
 *  - dispositifs non-numeriques / numeriques : tarif base sur la surface de
 *    la ligne.
 *
 * @param force  false (defaut) : ne corrige que les lignes dont le palier est
 *               faux (on ne "normalise" pas un tarif historique deja dans le
 *               bon palier).
 *               true : aligne TOUTES les lignes sur la grille de l'annee.
 *               Utilise quand le dossier est reconstruit de zero (reconduction,
 *               report d'annee) car les montants copies peuvent etre faux.
 */
export async function retariferEnseignes(occupationId: number, options: { force?: boolean } = {}) {
  const { force = false } = options;
  await chargerRegles();
  // Règle « tlpe.retarification.auto » : désactivée, seule une demande explicite (reconduction, report d'année) re-tarifie
  if (!R.bool('tlpe.retarification.auto') && !force) return { updated: [] as Array<{ ligneId: number; from: number; to: number }> };

  const occupation = await (prisma as any).occupation.findUnique({
    where: { id: occupationId },
    include: {
      lignes: {
        where: { deletedAt: null },
        include: { article: true }
      }
    }
  });

  if (!occupation || occupation.type !== 'TLPE') {
    return { updated: [] as Array<{ ligneId: number; from: number; to: number }> };
  }

  const anneeTaxation = occupation.anneeTaxation
    || (occupation.dateDebut ? new Date(occupation.dateDebut).getFullYear() : new Date().getFullYear());

  const { tarifs, articleIdBySlot } = await getTlpeGrille(anneeTaxation);

  const updated: Array<{ ligneId: number; from: number; to: number }> = [];

  for (const ligne of occupation.lignes) {
    // Cumul des seules enseignes presentes en meme temps que cette ligne (cf. getEnseigneSurfaceCumulee)
    const cumulEnseignes = getEnseigneSurfaceCumulee(occupation.lignes, { pour: ligne });
    const slotAttendu = getTlpeSlotAttendu(getTlpeType(ligne), ligne.quantite1 || 0, cumulEnseignes);
    if (!slotAttendu) continue;

    const tarifAttendu = tarifs[slotAttendu];
    const articleAttendu = articleIdBySlot[slotAttendu];
    // Palier non configure pour l'annee : on ne touche pas (ne jamais mettre 0).
    if (!articleAttendu) continue;

    const isRef = isTlpeRefArticle(ligne);

    const montantOk = Math.abs((ligne.montant || 0) - tarifAttendu) <= 0.005;
    const articleOk = !isRef || !articleAttendu || ligne.articleId === articleAttendu;

    const needsFix = force
      ? (!montantOk || !articleOk)
      // Sans force : on ne touche que les lignes dont le PALIER est faux.
      : (getTlpeSlotCourant(ligne, tarifs) !== null && getTlpeSlotCourant(ligne, tarifs) !== slotAttendu);

    if (!needsFix) continue;

    // Si la ligne pointe sur un article de reference (import historique), on
    // la reparente sur l'article du bon palier pour que libelle et tarif
    // restent coherents (UI, facture PDF). Une ligne de catalogue, elle,
    // garde son article : seul le montant porte le tarif.
    await (prisma as any).ligneOccupation.update({
      where: { id: ligne.id },
      data: {
        montant: tarifAttendu,
        ...(isRef && articleAttendu ? { articleId: articleAttendu } : {}),
      }
    });
    updated.push({ ligneId: ligne.id, from: ligne.montant || 0, to: tarifAttendu });
  }

  return { updated };
}

export { calculateQ2 } from './tlpe-tarifs';
