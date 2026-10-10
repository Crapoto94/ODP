import { timingSafeEqual, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { normaliserConfig, premiereDatePossible, iso, parseIso, type ConfigRegles } from '@/lib/tournage-regles';

// Config unique (id = 1), créée à la demande
export async function lireConfigTournage() {
  const db = prisma as any;
  let row = await db.tournageConfig.findUnique({ where: { id: 1 } });
  if (!row) row = await db.tournageConfig.create({ data: { id: 1, apiKey: randomBytes(24).toString('hex') } });
  return row;
}

export const reglesDe = (row: any): ConfigRegles => normaliserConfig(row);

// Authentifie le frontend public (DMZ) : en-tête x-api-key = clé de la config (ou variable TOURNAGE_API_KEY)
export async function verifierCleApi(req: Request): Promise<boolean> {
  const fournie = req.headers.get('x-api-key') || '';
  const row = await lireConfigTournage();
  const attendue = process.env.TOURNAGE_API_KEY || row.apiKey || '';
  if (!fournie || !attendue) return false;
  const a = Buffer.from(fournie), b = Buffer.from(attendue);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const TYPES_FILM = ['Fiction', 'Documentaire', 'Reportage', 'Film publicitaire', 'Clip musical', 'Court-métrage', 'Shooting photo', 'Autre'];
const RE_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface JourTournage { date: string; equipeArrivee: string; equipeDepart: string; vehiculesArrivee: string; vehiculesDepart: string }

// Validation serveur complète : le frontend ne fait que guider, les règles bloquantes sont rejouées ici.
export function validerDemande(d: any, regles: ConfigRegles, aujourdhui = new Date(), pieces: { assurance: boolean; plan: boolean; ecole: boolean }) {
  const erreurs: string[] = [];
  const txt = (v: any) => (typeof v === 'string' ? v.trim() : '');
  const dem = d?.demandeur || {};
  if (!txt(dem.societe)) erreurs.push('La société de production est obligatoire.');
  if (!txt(dem.nom)) erreurs.push('Le nom du demandeur est obligatoire.');
  if (!RE_MAIL.test(txt(dem.email))) erreurs.push('Une adresse e-mail valide est obligatoire.');
  if (!txt(dem.telephone)) erreurs.push('Le téléphone du demandeur est obligatoire.');

  if (!txt(d?.titre)) erreurs.push('Le titre du projet est obligatoire.');
  if (!TYPES_FILM.includes(txt(d?.typeFilm))) erreurs.push('Le type de film est obligatoire.');
  if (txt(d?.synopsis).length < 20) erreurs.push('Le synopsis (ou le sujet du reportage photo) est obligatoire.');
  if (txt(d?.scenes).length < 10) erreurs.push('Le descriptif des scènes à tourner en extérieur est obligatoire.');
  if (typeof d?.violence !== 'boolean') erreurs.push('Précisez s\'il s\'agit de scènes de violence.');
  if (typeof d?.armesFactices !== 'boolean') erreurs.push('Précisez si l\'utilisation d\'armes factices est prévue.');

  const jours: JourTournage[] = Array.isArray(d?.jours) ? d.jours : [];
  if (!jours.length) erreurs.push('Indiquez au moins un jour de tournage.');
  const { date: minimale, periode } = premiereDatePossible(aujourdhui, regles);
  const vus = new Set<string>();
  jours.forEach((j, i) => {
    const n = `Jour ${i + 1}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txt(j.date))) { erreurs.push(`${n} : date invalide.`); return; }
    if (vus.has(j.date)) erreurs.push(`${n} : date en double.`);
    vus.add(j.date);
    if (parseIso(j.date) < minimale) {
      erreurs.push(`${n} : le ${j.date.split('-').reverse().join('/')} est trop proche — les tournages ne peuvent débuter qu'à partir du ${iso(minimale).split('-').reverse().join('/')}${periode ? ' (période de fermeture du service)' : ''}.`);
    }
    for (const [champ, lib] of [['equipeArrivee', "arrivée de l'équipe"], ['equipeDepart', "départ de l'équipe"], ['vehiculesArrivee', 'arrivée des véhicules techniques'], ['vehiculesDepart', 'départ des véhicules techniques']] as const) {
      if (!RE_HEURE.test(txt((j as any)[champ]))) erreurs.push(`${n} : heure de ${lib} invalide (HH:MM).`);
    }
  });

  const lieu = d?.lieu || {};
  if (!Array.isArray(lieu.emplacements) || !lieu.emplacements.length) erreurs.push('Indiquez le lieu envisagé (trottoir, chaussée, stationnement…).');
  if (!txt(lieu.adresse)) erreurs.push('L\'adresse du lieu de tournage est obligatoire.');

  const plan = Array.isArray(d?.plan) ? d.plan : [];
  if (!plan.length || plan.some((p: any) => !txt(p?.date) || !txt(p?.lieu) || !txt(p?.heures) || !txt(p?.materiel))) {
    erreurs.push('Le plan de tournage doit préciser pour chaque date : lieu, heures et matériel employé.');
  }

  const pers = d?.personnes || {};
  const nbPers = ['equipe', 'comediens', 'figurants'].reduce((s, k) => s + (Number(pers[k]) || 0), 0);
  if (nbPers < 1) erreurs.push('Indiquez le nombre de personnes mobilisées (équipe, comédiens, figurants…).');

  const veh = d?.vehicules || {};
  if (!txt(veh.description)) erreurs.push('Décrivez les véhicules et le matériel à stationner (camions, camions-loge, camion-cantine…).');
  if (!(Number(veh.nbPlaces) >= 0) || veh.nbPlaces === '' || veh.nbPlaces == null) erreurs.push('Indiquez le nombre de places de stationnement occupées.');
  if (!txt(veh.localisation)) erreurs.push('Précisez la localisation (ex. du n° 10 au n° 18 de la rue …).');
  if (!pieces.plan) erreurs.push('Le plan de localisation du matériel et des véhicules (1/100e ou 1/200e) est obligatoire.');
  if (!pieces.assurance) erreurs.push('L\'attestation d\'assurance est obligatoire : sans elle, la demande ne peut pas être déposée.');

  if (d?.etudiant) {
    const e = d.ecole || {};
    if (!pieces.ecole) erreurs.push('Pour les étudiants, l\'attestation de l\'école relative au projet est obligatoire.');
    if (!txt(e.contact) || !txt(e.telephone) || !RE_MAIL.test(txt(e.email))) erreurs.push('Pour les étudiants, un contact de l\'école (nom, téléphone et e-mail) est obligatoire.');
  }
  if (d?.accepte !== true) erreurs.push('Vous devez confirmer l\'exactitude des informations et accepter les conditions.');
  return { erreurs, jours: jours.map((j) => j.date).filter(Boolean).sort() };
}
