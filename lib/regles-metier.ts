// Catalogue des règles métier de facturation (TLPE, commerces, chantiers, tournages, transversales).
// Chaque règle est débrayable (interrupteur) ou paramétrable (valeur / choix). Les valeurs modifiées sont stockées en base
// (table RegleMetier) ; ce module est utilisable côté client et serveur : il porte aussi l'état « actif » consulté par le code de calcul.

export type Domaine = 'TLPE' | 'COMMERCE' | 'CHANTIER' | 'TOURNAGE' | 'GENERAL';

export interface Regle {
  cle: string;
  domaine: Domaine;
  groupe: string;
  titre: string;
  description: string;            // formulation métier
  type: 'switch' | 'nombre' | 'choix' | 'info';
  defaut: boolean | number | string | null;
  unite?: string;
  min?: number; max?: number; pas?: number;
  choix?: { valeur: string; libelle: string }[];
  source?: string;                // texte de référence / endroit du code
  // `bridge` : la valeur est stockée ailleurs (options de la simulation des tournages)
  stockage?: 'regle' | 'tournageSimulation';
  simCle?: string;
  effet?: string;                 // ce que change la règle quand elle est modifiée
}

export const DOMAINES: { id: Domaine; label: string; description: string }[] = [
  { id: 'TLPE', label: 'T.L.P.E.', description: 'Taxe locale sur la publicité extérieure : enseignes et dispositifs publicitaires.' },
  { id: 'COMMERCE', label: 'Commerces', description: 'Occupations annuelles du domaine public par les commerces (terrasses, étalages…).' },
  { id: 'CHANTIER', label: 'Chantiers', description: 'Occupations temporaires : durées, tranches et calcul des quantités (valables aussi pour les tournages).' },
  { id: 'TOURNAGE', label: 'Tournages', description: 'Barèmes de tournage de films : simulation financière, abattements et exonérations.' },
  { id: 'GENERAL', label: 'Tous dossiers', description: 'Règles transversales : majoration, statuts après paiement, alertes.' },
];

const sw = (cle: string, domaine: Domaine, groupe: string, titre: string, description: string, defaut: boolean, extra: Partial<Regle> = {}): Regle => ({ cle, domaine, groupe, titre, description, type: 'switch', defaut, ...extra });
const nb = (cle: string, domaine: Domaine, groupe: string, titre: string, description: string, defaut: number, unite: string, extra: Partial<Regle> = {}): Regle => ({ cle, domaine, groupe, titre, description, type: 'nombre', defaut, unite, ...extra });
const ch = (cle: string, domaine: Domaine, groupe: string, titre: string, description: string, defaut: string, choix: { valeur: string; libelle: string }[], extra: Partial<Regle> = {}): Regle => ({ cle, domaine, groupe, titre, description, type: 'choix', defaut, choix, ...extra });
const info = (cle: string, domaine: Domaine, groupe: string, titre: string, description: string, extra: Partial<Regle> = {}): Regle => ({ cle, domaine, groupe, titre, description, type: 'info', defaut: null, ...extra });
const sim = (simCle: string, base: Regle): Regle => ({ ...base, cle: `tournage.sim.${simCle}`, stockage: 'tournageSimulation', simCle });

export const CATALOGUE: Regle[] = [
  // ───────────── TLPE ─────────────
  ch('tlpe.prorata.mode', 'TLPE', 'Calcul de la période', 'Prorata de la première et de la dernière période',
    "Comment un dispositif posé ou déposé en cours d'année est facturé. Par défaut, seuls les mois pleins sont facturés : un mois entamé n'est pas facturé.",
    'MOIS_PLEINS', [
      { valeur: 'MOIS_PLEINS', libelle: 'Mois pleins (mois entamé non facturé)' },
      { valeur: 'MOIS_ENTAMES', libelle: 'Mois entamés (tout mois commencé est facturé)' },
      { valeur: 'JOURS', libelle: 'Au jour (jours / jours de l\'année)' },
      { valeur: 'ANNEE', libelle: 'Année pleine (aucun prorata)' },
    ], { source: 'Facture PDF, total du dossier et train de facturation', effet: 'Totaux TLPE, factures et trains de facturation' }),
  sw('tlpe.exoneration.actif', 'TLPE', 'Exonération des enseignes', 'Exonération des enseignes sous le seuil',
    "Les enseignes dont la surface cumulée ne dépasse pas le seuil d'exonération ne sont pas facturées (surface totale, non proratisée).", true, { source: 'Délibération TLPE', effet: 'Montant des dossiers TLPE' }),
  nb('tlpe.exoneration.seuilDefaut', 'TLPE', 'Exonération des enseignes', "Seuil d'exonération par défaut", "Surface cumulée (m²) en dessous de laquelle les enseignes sont exonérées, quand aucun seuil n'est défini pour l'année dans la configuration TLPE.", 12, 'm²', { min: 0, max: 500, pas: 0.5, source: 'Seuil légal : 12 m²' }),
  sw('tlpe.exoneration.exclureScelleesSol', 'TLPE', 'Exonération des enseignes', 'Enseignes scellées au sol jamais exonérées',
    "Les enseignes scellées au sol ou posées directement sur le sol ne bénéficient jamais de l'exonération et ne comptent pas dans le seuil (backlog #47). Désactivé, elles sont traitées comme des enseignes ordinaires.", true, { source: 'Backlog #47' }),
  sw('tlpe.enseignes.cumul', 'TLPE', 'Tarif des enseignes', 'Tarif selon la surface cumulée des enseignes',
    "Le tarif au m² (12 à 50 m² ou plus de 50 m²) s'applique selon la surface cumulée de toutes les enseignes du dossier, et non enseigne par enseigne. Désactivé : palier selon la surface de chaque ligne.", true, { source: 'Délibération TLPE' }),
  sw('tlpe.enseignes.cumulSimultane', 'TLPE', 'Tarif des enseignes', 'Cumul des seules enseignes présentes en même temps',
    "Une enseigne supprimée en cours d'année ne s'ajoute pas à la surface d'une enseigne installée après sa suppression. Désactivé : toutes les enseignes de l'année sont cumulées.", true),
  nb('tlpe.palier.seuilM2', 'TLPE', 'Paliers tarifaires', 'Seuil du palier « plus de … m² »', "Surface à partir de laquelle s'applique le tarif du palier supérieur (enseignes cumulées ; dispositifs publicitaires par ligne).", 50, 'm²', { min: 1, max: 1000, pas: 1 }),
  sw('tlpe.retarification.auto', 'TLPE', 'Paliers tarifaires', 'Re-tarification automatique à chaque ajout',
    "À chaque ajout ou modification d'une ligne, les tarifs des autres lignes sont recalculés pour respecter le palier (surface cumulée). Désactivé : les montants ne sont plus corrigés automatiquement.", true),
  info('tlpe.info.montant', 'TLPE', 'Principe', 'Montant d\'une ligne', "Tarif au m² × surface × prorata de la période. Les tarifs viennent de la grille de l'année (Tarifs & Articles › TLPE)."),

  // ───────────── COMMERCES ─────────────
  sw('commerce.reconduction.retarifer', 'COMMERCE', 'Reconduction', "Reconduction avec le tarif de l'année cible",
    "À la reconduction d'un dispositif d'une année sur l'autre, la ligne reprend le tarif de l'article de l'année cible (apparié par désignation). Désactivé : le montant de l'année précédente est conservé.", true, { source: 'Reconduction des dispositifs' }),
  sw('commerce.degrevements.autorises', 'COMMERCE', 'Dégrèvements', 'Dégrèvements autorisés',
    "Permet d'ajouter une ligne de dégrèvement (montant négatif avec motif) à un dossier. Désactivé : l'ajout est refusé.", true, { source: 'Dossiers commerces et occupations' }),
  info('commerce.info.annuel', 'COMMERCE', 'Principe', 'Un dossier par commerce et par année', "Chaque commerce a un dossier par année de taxation, du 1er janvier au 31 décembre. Les dispositifs de plusieurs dossiers d'un même redevable peuvent être regroupés sur une facture."),
  info('commerce.info.ligne', 'COMMERCE', 'Principe', "Montant d'une ligne", "Tarif de l'article × quantité 1 (surface, nombre…) × quantité 2 (durée). La durée en années vaut 1 pour les tarifs annuels ; pour les tarifs au mois ou au jour elle suit les règles de durée (onglet Chantiers)."),

  // ───────────── CHANTIERS (durées) ─────────────
  sw('duree.jourInclusif', 'CHANTIER', 'Calcul des durées', 'Jour de début et jour de fin inclus', "Un chantier du 1er au 1er compte 1 jour. Désactivé : la durée est la différence de dates (le dernier jour n'est pas compté).", true, { effet: 'Chantiers et tournages' }),
  nb('duree.moisJours', 'CHANTIER', 'Calcul des durées', "Durée d'un mois de facturation", "Pour les tarifs « au mois », nombre de jours d'une tranche : la durée est arrondie à la tranche supérieure.", 30, 'jours', { min: 1, max: 31, pas: 1 }),
  nb('duree.trancheJours', 'CHANTIER', 'Calcul des durées', 'Durée de la tranche « 10 jours »', "Pour les tarifs « par tranche de 10 jours » : nombre de jours d'une tranche, arrondi à la tranche supérieure.", 10, 'jours', { min: 1, max: 31, pas: 1 }),
  sw('duree.constateesPrioritaires', 'CHANTIER', 'Calcul des durées', 'Dates constatées prioritaires', "Quand des dates constatées sont saisies, elles remplacent les dates prévues pour calculer la durée facturée.", true),
  sw('duree.recalculAuto', 'CHANTIER', 'Calcul des durées', 'Recalcul automatique de la durée (chantiers et tournages)', "À chaque enregistrement d'une ligne, la durée facturée est recalculée d'après les dates. Désactivé : la durée saisie à la main est conservée.", true, { source: 'Lignes des dossiers chantier et tournage' }),
  info('chantier.info.ligne', 'CHANTIER', 'Principe', "Montant d'une ligne", "Tarif × quantité 1 (surface, longueur, unités) × durée (jours, mois, tranches de 10 jours selon le mode de taxation de l'article)."),

  // ───────────── TOURNAGES ─────────────
  sw('tournage.courtMetrage.actif', 'TOURNAGE', 'Abattements', 'Minoration des courts-métrages sur la facture', "Un dossier de tournage marqué « court-métrage » reçoit une minoration en ligne sur sa facture et dans son total.", true, { source: 'Barème tournages 2026', effet: 'Total des dossiers de tournage et facture' }),
  nb('tournage.courtMetrage.taux', 'TOURNAGE', 'Abattements', 'Taux de la minoration court-métrage', "Pourcentage retiré du total d'un dossier de tournage « court-métrage » (50 % dans le barème et la délibération).", 50, '%', { min: 0, max: 100, pas: 1 }),
  nb('tournage.sim.abattementTaux', 'TOURNAGE', 'Simulation financière', 'Taux d\'abattement de la simulation', 'Abattement appliqué par la simulation des demandes (courts-métrages ≤ 59 min hors publicité, projets aidés par la Ville sur la voirie).', 50, '%', { min: 0, max: 100, stockage: 'tournageSimulation', simCle: 'abattementTaux' }),
  sim('abattementSur', ch('', 'TOURNAGE', 'Simulation financière', "L'abattement porte sur", "« Tout le barème », ou seulement les droits (équipe, stationnement, occupation), pas l'instruction ni les autorisations.", 'TOUT', [{ valeur: 'TOUT', libelle: 'Tout le barème' }, { valeur: 'DROITS', libelle: 'Les droits seulement' }])),
  sim('instructionHeures', nb('', 'TOURNAGE', 'Simulation financière', "Heures d'instruction estimées", '« Mise en œuvre technicien » (33,70 €/h) comptée par demande.', 4, 'heures', { min: 0, max: 100, pas: 0.5 })),
  sim('instructionAutorisationPour', ch('', 'TOURNAGE', 'Simulation financière', 'Instruction et autorisations pour', "Le barème voirie les prévoit ; la délibération bâtiments et le tarif sportif n'en parlent pas.", 'VOIE', [{ valeur: 'VOIE', libelle: 'La voirie seulement' }, { valeur: 'TOUS', libelle: 'Tous les lieux' }])),
  sim('nuitSeuilHeures', nb('', 'TOURNAGE', 'Simulation financière', 'Supplément de nuit dès', 'Nombre d\'heures de tournage entre 20 h et 8 h déclenchant le supplément de nuit.', 1, 'heures', { min: 0, max: 12, pas: 0.5 })),
  sim('demiJourneeMaxHeures', nb('', 'TOURNAGE', 'Simulation financière', 'Demi-journée (bâtiments) jusqu\'à', 'Durée maximale d\'une demi-journée ; au-delà, journée complète.', 5, 'heures', { min: 1, max: 12, pas: 0.5 })),
  sim('sportUnite', ch('', 'TOURNAGE', 'Simulation financière', 'Gymnases, salles, piscine, tennis facturés', "Les tarifs sportifs ne précisent pas l'unité : à l'heure d'occupation (hypothèse retenue) ou une fois par jour.", 'HEURE', [{ valeur: 'HEURE', libelle: "À l'heure" }, { valeur: 'JOUR', libelle: 'Par jour' }])),
  sim('reglesSport', ch('', 'TOURNAGE', 'Simulation financière', 'Abattements pour les équipements sportifs', 'Non précisés dans leur tarif : appliquer les règles de la voirie, des bâtiments, ou aucune.', 'VOIRIE', [{ valeur: 'VOIRIE', libelle: 'Comme la voirie' }, { valeur: 'BATIMENTS', libelle: 'Comme les bâtiments publics' }, { valeur: 'AUCUNE', libelle: 'Aucun' }])),
  sim('aideVille', ch('', 'TOURNAGE', 'Simulation financière', 'Projet aidé par la Ville (voirie)', 'Le barème voirie prévoit un abattement de 50 % ; la délibération bâtiments, une exonération.', 'ABATTEMENT', [{ valeur: 'ABATTEMENT', libelle: 'Abattement' }, { valeur: 'EXONERATION', libelle: 'Exonération' }])),
  sim('exoneratEcoles', sw('', 'TOURNAGE', 'Simulation financière', "Gratuité des projets d'écoles", "Sur présentation de l'attestation de l'école (projets étudiants).", true)),
  sim('signalisation', sw('', 'TOURNAGE', 'Simulation financière', 'Signalisation verticale du stationnement', 'Ajoute la signalisation (59,55 €/jour/lieu) quand des places de stationnement sont neutralisées.', true)),
  info('tournage.info.delais', 'TOURNAGE', 'Instruction', "Délai d'instruction", "15 jours ouvrés (lundi-vendredi, hors jours fériés), périodes d'absence du service : à régler dans Paramètres › Gestion des tournages."),

  // ───────────── TOUS DOSSIERS ─────────────
  sw('majoration.nonAutorise.actif', 'GENERAL', 'Majoration', 'Majoration des occupations non autorisées', "Un dossier marqué « sans autorisation » est majoré sur sa facture (le tarif normal est complété d'une ligne de majoration).", true, { source: 'Facture et train de facturation' }),
  nb('majoration.nonAutorise.taux', 'GENERAL', 'Majoration', 'Taux de la majoration', "Pourcentage du montant ajouté en cas d'occupation non autorisée (100 % = doublement des droits).", 100, '%', { min: 0, max: 500, pas: 5 }),
  sw('statut.sedit.clos', 'GENERAL', 'Statuts après facturation', 'Dossier clos quand le titre est payé', "Lecture de SEDIT : un titre payé passe le dossier au statut Clos (date de paiement et note automatique).", true, { source: 'Synchronisation SEDIT' }),
  sw('statut.sedit.titre', 'GENERAL', 'Statuts après facturation', 'Dossier titré quand le titre est émis', "Lecture de SEDIT : un titre émis mais non payé passe le dossier au statut Titré.", true),
  sw('alerte.mailInstructeurs', 'GENERAL', 'Alertes', "Mail quotidien « date d'alerte » aux instructeurs", "Le jour de la date d'alerte d'un dossier chantier ou tournage, un mail est envoyé aux instructeurs.", true, { source: 'Alertes des dossiers' }),
];

export const PAR_CLE: Record<string, Regle> = Object.fromEntries(CATALOGUE.map((r) => [r.cle, r]));

export type ValeursRegles = Record<string, boolean | number | string>;

export const reglesParDefaut = (): ValeursRegles =>
  Object.fromEntries(CATALOGUE.filter((r) => r.type !== 'info').map((r) => [r.cle, r.defaut as boolean | number | string]));

// Valeurs résolues : défauts surchargés par les valeurs enregistrées (valeurs invalides ignorées)
export function resoudre(surcharges: Record<string, any>): ValeursRegles {
  const out = reglesParDefaut();
  for (const [cle, v] of Object.entries(surcharges || {})) {
    const r = PAR_CLE[cle];
    if (!r || r.type === 'info') continue;
    if (r.type === 'switch' && typeof v === 'boolean') out[cle] = v;
    else if (r.type === 'nombre' && typeof v === 'number' && Number.isFinite(v) && (r.min == null || v >= r.min) && (r.max == null || v <= r.max)) out[cle] = v;
    else if (r.type === 'choix' && typeof v === 'string' && r.choix?.some((c) => c.valeur === v)) out[cle] = v;
  }
  return out;
}

// ── État actif consulté par le code de calcul (rempli par le serveur à chaque calcul, et par le navigateur au chargement) ──
let actives: ValeursRegles = reglesParDefaut();
export const setReglesActives = (v: ValeursRegles) => { actives = { ...reglesParDefaut(), ...v }; };
export const reglesActives = () => actives;
export const R = {
  bool: (cle: string): boolean => Boolean(actives[cle] ?? PAR_CLE[cle]?.defaut),
  num: (cle: string): number => Number(actives[cle] ?? PAR_CLE[cle]?.defaut),
  str: (cle: string): string => String(actives[cle] ?? PAR_CLE[cle]?.defaut),
};
