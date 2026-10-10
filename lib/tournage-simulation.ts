import { joursFeries, iso, parseIso } from '@/lib/tournage-regles';

// Simulation financière d'une demande de tournage, d'après les barèmes de la Ville :
//  - VOIE / ESPACE_VERT : barème « tournages de films » 2026 (instruction, stationnement, occupation, équipe…)
//  - BATIMENT          : délibération du 13/02/2025 (bâtiments publics hors voirie, équipements sportifs et espaces verts)
//  - SPORT             : tarifs « équipements sportifs, tournages de films et prises de vues » 2025/2026
// Les prix viennent des articles du module Tarifs & Articles (par numéro) ; à défaut, des valeurs ci-dessous.
// Les règles incertaines sont des OPTIONS (Paramètres › Gestion des tournages › Tarification).

export type TypeLieu = 'VOIE' | 'ESPACE_VERT' | 'BATIMENT' | 'SPORT';
export type Equipement = 'piscine' | 'gymnase' | 'salle_sport' | 'stade' | 'tennis' | 'plateau';

export const TYPES_LIEU: { id: TypeLieu; label: string }[] = [
  { id: 'VOIE', label: 'Voie publique (trottoir, chaussée, stationnement…)' },
  { id: 'ESPACE_VERT', label: 'Espace vert' },
  { id: 'BATIMENT', label: 'Bâtiment municipal (salle, école, CMS…)' },
  { id: 'SPORT', label: 'Équipement sportif (stade, gymnase, piscine…)' },
];
export const EQUIPEMENTS: { id: Equipement; label: string }[] = [
  { id: 'piscine', label: 'Bassin de la piscine municipale' },
  { id: 'gymnase', label: "Gymnase, salle d'escrime, tennis de table, bulle de tennis" },
  { id: 'salle_sport', label: 'Salle de sport, de combat, gymnase scolaire, salle de musculation' },
  { id: 'stade', label: 'Stade (terrain engazonné / synthétique, piste d\'athlétisme)' },
  { id: 'tennis', label: 'Court de tennis municipal' },
  { id: 'plateau', label: "Plateau d'évolution" },
];

export interface OptionsSimulation {
  abattementSur: 'TOUT' | 'DROITS';           // l'abattement de 50 % porte sur tout le barème ou seulement sur les droits (hors instruction, autorisations, signalisation)
  abattementTaux: number;                      // 50
  nuitSeuilHeures: number;                     // heures de tournage entre 20h et 8h à partir desquelles le supplément de nuit s'applique
  demiJourneeMaxHeures: number;                // bâtiments : durée maximale d'une demi-journée
  instructionHeures: number;                   // heures de « mise en œuvre technicien » estimées par demande
  instructionAutorisationPour: 'VOIE' | 'TOUS'; // instruction et autorisations : voirie seulement, ou tous les lieux
  signalisation: boolean;                      // ajoute la signalisation verticale quand des places de stationnement sont neutralisées
  sportUnite: 'HEURE' | 'JOUR';                // gymnases, salles, piscine, tennis : facturés à l'heure d'occupation ou une fois par jour
  reglesSport: 'VOIRIE' | 'BATIMENTS' | 'AUCUNE'; // abattements / exonérations applicables aux équipements sportifs (non précisés dans leur tarif)
  aideVille: 'ABATTEMENT' | 'EXONERATION';    // voirie : projet aidé par la Ville (Coup de pouce, COREUS)
  exoneratEcoles: boolean;                     // gratuité des projets d'écoles
}

export const OPTIONS_PAR_DEFAUT: OptionsSimulation = {
  abattementSur: 'TOUT', abattementTaux: 50, nuitSeuilHeures: 1, demiJourneeMaxHeures: 5, instructionHeures: 4,
  instructionAutorisationPour: 'VOIE', signalisation: true, sportUnite: 'HEURE', reglesSport: 'VOIRIE', aideVille: 'ABATTEMENT', exoneratEcoles: true,
};

export const normaliserOptions = (o: any): OptionsSimulation => ({ ...OPTIONS_PAR_DEFAUT, ...(o && typeof o === 'object' ? o : {}) });

export interface Surcharges {
  abattement?: 'AUTO' | 'OUI' | 'NON';
  gratuit?: 'AUTO' | 'OUI' | 'NON';
  typeLieu?: TypeLieu; equipement?: Equipement; surfaceM2?: number; cablesM?: number; instructionHeures?: number;
}

// code → numéro d'article + prix de repli
export const CODES: Record<string, { numero: string; designation: string; montant: number; unite: string }> = {
  INSTR: { numero: '4.01', designation: 'Mise en œuvre technicien (instruction, RDV sur site, contrôle)', montant: 33.7, unite: 'heure' },
  AUTORISATION: { numero: '4.02', designation: "Obtention d'autorisations administratives", montant: 131.85, unite: 'forfait' },
  SIGNA: { numero: '4.03', designation: 'Signalisation verticale (5 panneaux max.)', montant: 59.55, unite: 'jour/lieu' },
  CABLE: { numero: '4.04', designation: "Câbles d'électricité pour alimentation temporaire", montant: 5.3, unite: 'mètre/mois' },
  EQ_10: { numero: '4.05', designation: 'Équipe de 10 personnes et moins', montant: 330.8, unite: 'jour' },
  EQ_20: { numero: '4.06', designation: 'Équipe de 11 à 20 personnes', montant: 661.5, unite: 'jour' },
  EQ_30: { numero: '4.07', designation: 'Équipe de 21 à 30 personnes', montant: 842.2, unite: 'jour' },
  EQ_80: { numero: '4.08', designation: 'Équipe de 31 à 80 personnes', montant: 1021.7, unite: 'jour' },
  EQ_150: { numero: '4.09', designation: 'Équipe de 81 à 150 personnes', montant: 1213.6, unite: 'jour' },
  EQ_PLUS: { numero: '4.10', designation: 'Équipe de plus de 150 personnes', montant: 1443.85, unite: 'jour' },
  NUIT: { numero: '4.11', designation: 'Supplément tournage entre 20 h et 8 h', montant: 421.1, unite: 'nuit' },
  STAT: { numero: '2.18', designation: 'Neutralisation / réservation de places de stationnement', montant: 13.25, unite: 'place/jour' },
  OCC: { numero: '2.19', designation: 'Occupation du domaine public (hors espaces verts)', montant: 3.35, unite: 'm²/jour' },
  OCC_VERT: { numero: '2.20', designation: "Occupation d'un espace vert", montant: 4, unite: 'm²/jour' },
  B_JOUR: { numero: '7.01', designation: 'Bâtiment public : journée en semaine', montant: 550, unite: 'jour' },
  B_NUIT: { numero: '7.02', designation: 'Bâtiment public : nuit, dimanche ou jour férié', montant: 900, unite: 'jour' },
  B_DEMI: { numero: '7.03', designation: 'Bâtiment public : demi-journée en semaine', montant: 250, unite: 'demi-journée' },
  B_DEMI_NUIT: { numero: '7.04', designation: 'Bâtiment public : demi-nuit, demi-journée dimanche ou férié', montant: 400, unite: 'demi-journée' },
  B_EQ_10: { numero: '7.06', designation: 'Bâtiment public : forfait équipe de 1 à 10 personnes', montant: 0, unite: 'jour' },
  B_EQ_20: { numero: '7.07', designation: 'Bâtiment public : forfait équipe de 11 à 20 personnes', montant: 500, unite: 'jour' },
  B_EQ_50: { numero: '7.08', designation: 'Bâtiment public : forfait équipe de 21 à 50 personnes', montant: 900, unite: 'jour' },
  B_EQ_PLUS: { numero: '7.09', designation: 'Bâtiment public : forfait équipe de plus de 50 personnes', montant: 1400, unite: 'jour' },
  S_PISCINE: { numero: '8.01', designation: 'Piscine municipale (grand bassin + petit bassin)', montant: 904.18, unite: 'heure' },
  S_GYMNASE: { numero: '8.02', designation: "Gymnase, salle d'escrime, tennis de table, bulle de tennis", montant: 214.55, unite: 'heure' },
  S_SALLE: { numero: '8.03', designation: 'Salle de sport, de combat, gymnase scolaire, salle de musculation', montant: 107.91, unite: 'heure' },
  S_STADE_J: { numero: '8.04', designation: 'Stade, créneau diurne (8h-18h)', montant: 313.52, unite: 'créneau' },
  S_STADE_N: { numero: '8.05', designation: 'Stade, créneau nocturne (à partir de 18h)', montant: 624.74, unite: 'créneau' },
  S_TENNIS: { numero: '8.06', designation: 'Court de tennis municipal', montant: 51.22, unite: 'heure' },
  S_EQ_10: { numero: '8.07', designation: "Plateau d'évolution : équipe de 10 personnes et moins", montant: 311.2, unite: 'jour' },
  S_EQ_20: { numero: '8.08', designation: "Plateau d'évolution : équipe de 11 à 20 personnes", montant: 622.3, unite: 'jour' },
  S_EQ_30: { numero: '8.09', designation: "Plateau d'évolution : équipe de 21 à 30 personnes", montant: 792.25, unite: 'jour' },
  S_EQ_80: { numero: '8.10', designation: "Plateau d'évolution : équipe de 31 à 80 personnes", montant: 961.1, unite: 'jour' },
  S_EQ_150: { numero: '8.11', designation: "Plateau d'évolution : équipe de 81 à 150 personnes", montant: 1141.65, unite: 'jour' },
  S_EQ_PLUS: { numero: '8.12', designation: "Plateau d'évolution : équipe de plus de 150 personnes", montant: 1358.3, unite: 'jour' },
  S_NUIT: { numero: '8.13', designation: 'Équipement sportif : supplément tournage entre 20h et 8h', montant: 396.1, unite: 'nuit' },
};

export interface TarifArticle { montant: number; designation: string; articleId?: number }
export type Tarifs = Record<string, TarifArticle>;

export interface LigneSimulation {
  code: string; groupe: string; designation: string; quantite1: number; quantite2: number; unite: string;
  montantUnitaire: number; montant: number; droits: boolean; articleId?: number; detail?: string;
}
export interface Simulation {
  bareme: 'VOIRIE' | 'BATIMENTS' | 'SPORT'; typeLieu: TypeLieu; equipement?: Equipement; annee: number; nbJours: number; personnes: number;
  lignes: LigneSimulation[]; sousTotal: number;
  abattement: { libelle: string; taux: number; base: number; montant: number } | null;
  gratuit: { motif: string } | null;
  total: number; avertissements: string[]; surfaceM2: number; cablesM: number;
}

const arrondi = (n: number) => Math.round(n * 100) / 100;
const heure = (s: string) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) + (m || 0) / 60; };
const chevauchement = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

// Heures de tournage de l'équipe pour un jour : durée, heures de nuit (20h-8h), présence en créneau diurne (8h-18h) / nocturne (après 18h)
function analyseJour(j: any) {
  const arr = heure(j.equipeArrivee);
  let dep = heure(j.equipeDepart);
  if (dep <= arr) dep += 24;
  const duree = dep - arr;
  const nuit = [[0, 8], [20, 32], [44, 56]].reduce((s, [a, b]) => s + chevauchement(arr, dep, a, b), 0);
  return { arr, dep, duree, nuit, diurne: chevauchement(arr, dep, 8, 18) > 0, nocturne: dep > 18 };
}

function trancheEquipe(n: number, prefixe: 'EQ' | 'B_EQ' | 'S_EQ'): string {
  if (prefixe === 'B_EQ') return n <= 10 ? 'B_EQ_10' : n <= 20 ? 'B_EQ_20' : n <= 50 ? 'B_EQ_50' : 'B_EQ_PLUS';
  return n <= 10 ? `${prefixe}_10` : n <= 20 ? `${prefixe}_20` : n <= 30 ? `${prefixe}_30` : n <= 80 ? `${prefixe}_80` : n <= 150 ? `${prefixe}_150` : `${prefixe}_PLUS`;
}

export function simuler(donnees: any, typeFilm: string, tarifs: Tarifs, opt: OptionsSimulation, surcharges: Surcharges = {}): Simulation {
  const d = donnees || {};
  const avert: string[] = [];
  const jours = [...(d.jours || [])].filter((j: any) => j?.date).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
  const N = jours.length;
  const lieu = d.lieu || {};
  const typeLieu: TypeLieu = surcharges.typeLieu || lieu.typeLieu || 'VOIE';
  const equipement: Equipement | undefined = surcharges.equipement || lieu.equipement;
  const p = d.personnes || {};
  const personnes = ['equipe', 'comediens', 'figurants', 'autres'].reduce((s, k) => s + (Number(p[k]) || 0), 0);
  const annee = jours[0] ? Number(String(jours[0].date).slice(0, 4)) : new Date().getFullYear();
  const surface = surcharges.surfaceM2 ?? Number(lieu.surfaceM2 || 0);
  const cablesM = surcharges.cablesM ?? Number(lieu.cablesM || 0);
  const places = Number(d.vehicules?.nbPlaces || 0);
  const instrH = surcharges.instructionHeures ?? opt.instructionHeures;
  const bareme: Simulation['bareme'] = typeLieu === 'BATIMENT' ? 'BATIMENTS' : typeLieu === 'SPORT' ? 'SPORT' : 'VOIRIE';

  const lignes: LigneSimulation[] = [];
  const add = (code: string, groupe: string, q1: number, q2: number, droits = true, detail?: string) => {
    if (!(q1 > 0) || !(q2 > 0)) return;
    const base = CODES[code]; const t = tarifs[code];
    const pu = t?.montant ?? base.montant;
    lignes.push({ code, groupe, designation: t?.designation || base.designation, quantite1: q1, quantite2: q2, unite: base.unite, montantUnitaire: pu, montant: arrondi(pu * q1 * q2), droits, articleId: t?.articleId, detail });
  };

  if (!N) avert.push('Aucun jour de tournage : simulation impossible.');
  const analyses = jours.map(analyseJour);
  const nbNuits = analyses.filter((a) => a.nuit >= opt.nuitSeuilHeures).length;
  const periode = N ? Math.max(1, Math.round((parseIso(jours[N - 1].date).getTime() - parseIso(jours[0].date).getTime()) / 86400000) + 1) : 0;
  const feries = new Set<string>(); for (const j of jours) joursFeries(Number(String(j.date).slice(0, 4))).forEach((x) => feries.add(x));

  // Instruction et autorisations (voirie par défaut)
  const avecInstr = opt.instructionAutorisationPour === 'TOUS' || bareme === 'VOIRIE';
  if (N && avecInstr) {
    add('INSTR', 'Instruction, autorisations', instrH, 1, false, `${instrH} h estimées`);
    add('AUTORISATION', 'Instruction, autorisations', 1, 1, false);
  }

  if (N && bareme === 'VOIRIE') {
    add(trancheEquipe(personnes, 'EQ'), 'Équipe', 1, N, true, `${personnes} personnes`);
    add('NUIT', 'Équipe', 1, nbNuits, true, `${nbNuits} jour(s) avec ≥ ${opt.nuitSeuilHeures} h entre 20 h et 8 h`);
    add('STAT', 'Stationnement', places, N, true, places ? `${places} place(s) × ${N} jour(s)` : undefined);
    if (opt.signalisation && places > 0) add('SIGNA', 'Instruction, autorisations', 1, N, false, 'signalisation du stationnement neutralisé (1 lieu)');
    if (surface > 0) add(typeLieu === 'ESPACE_VERT' ? 'OCC_VERT' : 'OCC', 'Occupation', surface, N, true, `${surface} m² × ${N} jour(s)`);
    else avert.push("Surface occupée (m²) non renseignée : l'occupation du domaine public n'est pas chiffrée.");
    if (cablesM > 0) add('CABLE', 'Occupation', cablesM, Math.max(1, Math.ceil(periode / 30)), true, `${cablesM} m`);
  }

  if (N && bareme === 'BATIMENTS') {
    let jour = 0, nuit = 0, demi = 0, demiNuit = 0;
    jours.forEach((j: any, i: number) => {
      const a = analyses[i]; const dt = parseIso(j.date);
      const special = a.nuit >= opt.nuitSeuilHeures || dt.getDay() === 0 || feries.has(iso(dt));
      if (a.duree <= opt.demiJourneeMaxHeures) { if (special) demiNuit++; else demi++; } else if (special) nuit++; else jour++;
    });
    add('B_JOUR', 'Mise à disposition', 1, jour); add('B_NUIT', 'Mise à disposition', 1, nuit);
    add('B_DEMI', 'Mise à disposition', 1, demi); add('B_DEMI_NUIT', 'Mise à disposition', 1, demiNuit);
    add(trancheEquipe(personnes, 'B_EQ'), 'Équipe', 1, N, true, `${personnes} personnes`);
    avert.push("Les journées d'occupation sans tournage (préparation, démontage : 250 €) ne sont pas dans la demande : à ajouter manuellement.");
  }

  if (N && bareme === 'SPORT') {
    if (!equipement) avert.push("Équipement sportif non précisé : choisissez-le pour chiffrer la mise à disposition.");
    else if (equipement === 'plateau') {
      add(trancheEquipe(personnes, 'S_EQ'), 'Plateau d\'évolution', 1, N, true, `${personnes} personnes (taux journée)`);
      add('S_NUIT', 'Plateau d\'évolution', 1, nbNuits, true);
    } else if (equipement === 'stade') {
      add('S_STADE_J', 'Mise à disposition', 1, analyses.filter((a) => a.diurne).length, true, 'créneau 8h-18h');
      add('S_STADE_N', 'Mise à disposition', 1, analyses.filter((a) => a.nocturne).length, true, 'créneau après 18h');
    } else {
      const code = { piscine: 'S_PISCINE', gymnase: 'S_GYMNASE', salle_sport: 'S_SALLE', tennis: 'S_TENNIS' }[equipement];
      if (opt.sportUnite === 'HEURE') { const h = arrondi(analyses.reduce((s, a) => s + a.duree, 0)); add(code, 'Mise à disposition', h, 1, true, `${h} h d'occupation`); }
      else add(code, 'Mise à disposition', 1, N, true, `${N} jour(s)`);
    }
  }

  const sousTotal = arrondi(lignes.reduce((s, l) => s + l.montant, 0));

  // Exonérations et abattements selon le barème applicable
  const regle: 'VOIRIE' | 'BATIMENTS' | 'AUCUNE' = bareme === 'SPORT' ? opt.reglesSport : bareme === 'BATIMENTS' ? 'BATIMENTS' : 'VOIRIE';
  const pub = String(typeFilm) === 'Film publicitaire';
  const dureeMin = Number(d.dureeMinutes || 0);
  const court = !pub && (String(typeFilm) === 'Court-métrage' || (dureeMin > 0 && dureeMin <= 59)) && !(dureeMin > 59);
  const aide: string = d.aide || '';
  let gratuitMotif = '';
  if (regle !== 'AUCUNE') {
    if (opt.exoneratEcoles && d.etudiant) gratuitMotif = "Projet d'école (gratuité)";
    else if (regle === 'BATIMENTS' && ['VILLE', 'DEPARTEMENT', 'REGION'].includes(aide)) gratuitMotif = `Projet aidé (${aide === 'VILLE' ? 'Ville' : aide === 'DEPARTEMENT' ? 'Département' : 'Région'}) : exonération`;
    else if (regle === 'VOIRIE' && aide === 'VILLE' && opt.aideVille === 'EXONERATION') gratuitMotif = 'Projet aidé par la Ville : exonération';
  }
  if (surcharges.gratuit === 'OUI') gratuitMotif = gratuitMotif || 'Exonération appliquée manuellement';
  if (surcharges.gratuit === 'NON') gratuitMotif = '';
  const gratuit = gratuitMotif ? { motif: gratuitMotif } : null;

  let abattement: Simulation['abattement'] = null;
  if (!gratuit) {
    let motif = '';
    if (regle !== 'AUCUNE') {
      if (court) motif = 'Court-métrage (≤ 59 min, hors publicité)';
      else if (regle === 'VOIRIE' && aide === 'VILLE' && opt.aideVille === 'ABATTEMENT') motif = 'Projet aidé par la Ville (Coup de pouce, COREUS)';
    }
    if (surcharges.abattement === 'OUI') motif = motif || 'Abattement appliqué manuellement';
    if (surcharges.abattement === 'NON') motif = '';
    if (motif) {
      const base = arrondi(lignes.filter((l) => opt.abattementSur === 'TOUT' || l.droits).reduce((s, l) => s + l.montant, 0));
      abattement = { libelle: motif, taux: opt.abattementTaux, base, montant: arrondi((base * opt.abattementTaux) / 100) };
    }
  }
  if (bareme === 'SPORT' && opt.reglesSport !== 'AUCUNE') avert.push("Le tarif des équipements sportifs ne précise pas les abattements : appliqués comme pour " + (opt.reglesSport === 'BATIMENTS' ? 'les bâtiments publics' : 'la voirie') + ' (option).');
  if (bareme === 'VOIRIE' && ['DEPARTEMENT', 'REGION'].includes(aide)) avert.push("Aide du Département ou de la Région : sans effet sur le barème voirie (exonération prévue seulement pour les bâtiments publics).");

  const total = gratuit ? 0 : arrondi(sousTotal - (abattement?.montant || 0));
  return { bareme, typeLieu, equipement, annee, nbJours: N, personnes, lignes, sousTotal, abattement, gratuit, total, avertissements: avert, surfaceM2: surface, cablesM };
}
