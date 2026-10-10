import { timingSafeEqual, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { normaliserConfig, premiereDatePossible, iso, parseIso, type ConfigRegles } from '@/lib/tournage-regles';

// Crée les tables du module si la migration Prisma n'a pas (encore) été appliquée sur le schéma courant (idempotent).
const DDL = [
  `CREATE TABLE IF NOT EXISTS "DemandeTournage" ("id" SERIAL NOT NULL, "reference" TEXT NOT NULL, "statut" TEXT NOT NULL DEFAULT 'NOUVELLE', "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dateLimiteReponse" TIMESTAMP(3), "premiereDate" TIMESTAMP(3), "derniereDate" TIMESTAMP(3), "societe" TEXT NOT NULL, "demandeurNom" TEXT NOT NULL, "email" TEXT NOT NULL, "telephone" TEXT, "titre" TEXT NOT NULL, "typeFilm" TEXT NOT NULL, "donnees" JSONB NOT NULL, "pieces" JSONB NOT NULL DEFAULT '[]', "notesInternes" TEXT, "occupationId" INTEGER, "traiteePar" TEXT, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "DemandeTournage_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "TournageConfig" ("id" INTEGER NOT NULL DEFAULT 1, "actif" BOOLEAN NOT NULL DEFAULT true, "delaiInstruction" INTEGER NOT NULL DEFAULT 15, "typeJours" TEXT NOT NULL DEFAULT 'OUVRES', "exclureFeries" BOOLEAN NOT NULL DEFAULT true, "delaiMinimalDepot" INTEGER NOT NULL DEFAULT 0, "periodesAbsence" JSONB NOT NULL DEFAULT '[]', "messageAccueil" TEXT, "emailNotification" TEXT, "apiKey" TEXT, "frontendsAutorises" JSONB NOT NULL DEFAULT '[]', "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "TournageConfig_pkey" PRIMARY KEY ("id"))`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "frontendsAutorises" JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailExpediteurNom" TEXT`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailExpediteurEmail" TEXT`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter1" TEXT`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter2" TEXT`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter3" TEXT`,
  `ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooterColor" TEXT`,
  `CREATE TABLE IF NOT EXISTS "ServiceInstructeur" ("id" SERIAL NOT NULL, "code" TEXT NOT NULL, "nom" TEXT NOT NULL, "description" TEXT, "emails" JSONB NOT NULL DEFAULT '[]', "questions" JSONB NOT NULL DEFAULT '[]', "circuitPropre" BOOLEAN NOT NULL DEFAULT false, "actif" BOOLEAN NOT NULL DEFAULT true, "ordre" INTEGER NOT NULL DEFAULT 0, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "ServiceInstructeur_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ServiceInstructeur_code_key" ON "ServiceInstructeur"("code")`,
  `CREATE TABLE IF NOT EXISTS "AvisTournage" ("id" SERIAL NOT NULL, "demandeId" INTEGER NOT NULL, "serviceId" INTEGER, "serviceNom" TEXT NOT NULL, "libre" BOOLEAN NOT NULL DEFAULT false, "destinataires" JSONB NOT NULL DEFAULT '[]', "token" TEXT NOT NULL, "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE', "message" TEXT, "questions" JSONB NOT NULL DEFAULT '[]', "reponseCommentaire" TEXT, "reponseDonnees" JSONB, "reponduPar" TEXT, "demandePar" TEXT, "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dateReponse" TIMESTAMP(3), "derniereRelance" TIMESTAMP(3), "nbRelances" INTEGER NOT NULL DEFAULT 0, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "AvisTournage_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AvisTournage_token_key" ON "AvisTournage"("token")`,
  `CREATE INDEX IF NOT EXISTS "AvisTournage_demandeId_idx" ON "AvisTournage"("demandeId")`,
  `CREATE INDEX IF NOT EXISTS "AvisTournage_statut_idx" ON "AvisTournage"("statut")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DemandeTournage_reference_key" ON "DemandeTournage"("reference")`,
  `CREATE INDEX IF NOT EXISTS "DemandeTournage_statut_idx" ON "DemandeTournage"("statut")`,
  `CREATE INDEX IF NOT EXISTS "DemandeTournage_dateDepot_idx" ON "DemandeTournage"("dateDepot")`,
];
const pretParSchema = new Set<string>();
export async function assurerTablesTournage() {
  const db = prisma as any;
  const [{ s }] = await db.$queryRawUnsafe('SELECT current_schema() AS s');
  if (pretParSchema.has(s)) return;
  for (const q of DDL) await db.$executeRawUnsafe(q);
  // Services consultés par défaut (sans adresse e-mail : à renseigner dans l'administration)
  if ((await db.serviceInstructeur.count()) === 0) {
    for (const [i, svc] of SERVICES_PAR_DEFAUT.entries()) await db.serviceInstructeur.create({ data: { ...svc, ordre: i } });
  }
  pretParSchema.add(s);
}

export interface QuestionService { id: string; libelle: string; type: 'OUINON' | 'TEXTE' }

// La DAC (point d'entrée unique) consulte selon les cas ces services
export const SERVICES_PAR_DEFAUT: { code: string; nom: string; description: string; questions: QuestionService[]; circuitPropre: boolean }[] = [
  { code: 'DEP', nom: "Direction de l'espace public", circuitPropre: true, questions: [],
    description: "Arrêtés de stationnement et occupation de l'espace public. Circuit de signature et tarifs propres." },
  { code: 'DSPORTS', nom: 'Direction des sports (stades)', circuitPropre: false,
    description: 'Mise à disposition des stades et équipements sportifs.',
    questions: [{ id: 'assos', libelle: 'Les locaux sont-ils utilisés par des associations sportives sur le créneau demandé ?', type: 'OUINON' }] },
  { code: 'EDUC', nom: 'Éducation (écoles)', circuitPropre: false, questions: [], description: "Mise à disposition des locaux scolaires (service éducation)." },
  { code: 'CMS', nom: 'Centre municipal de santé (CMS)', circuitPropre: false,
    description: 'Mise à disposition des locaux du CMS.',
    questions: [
      { id: 'soignant', libelle: "La présence d'un médecin ou d'un infirmier dans la salle est-elle nécessaire ?", type: 'OUINON' },
      { id: 'soignant_precisions', libelle: 'Précisions (profil, horaires…)', type: 'TEXTE' },
    ] },
  { code: 'SALLES', nom: 'Salles municipales', circuitPropre: false, questions: [], description: 'Mise à disposition des salles municipales.' },
  { code: 'AUTRES', nom: 'Autres gestionnaires de locaux', circuitPropre: false, questions: [], description: 'Autres gestionnaires de locaux consultés au cas par cas.' },
];

// Config unique (id = 1), créée à la demande
export async function lireConfigTournage() {
  const db = prisma as any;
  await assurerTablesTournage();
  let row = await db.tournageConfig.findUnique({ where: { id: 1 } });
  if (!row) row = await db.tournageConfig.create({ data: { id: 1, apiKey: randomBytes(24).toString('hex') } });
  return row;
}

export const reglesDe = (row: any): ConfigRegles => normaliserConfig(row);

// IP de l'appelant (le frontend de la DMZ) : en-têtes posés par Next / le reverse proxy
export function ipClient(req: Request): string {
  const brut = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
  return brut.replace(/^::ffff:/, '');
}

const versEntier = (ip: string) => ip.split('.').reduce((n, o) => n * 256 + (parseInt(o, 10) || 0), 0);
const estIpv4 = (s: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);

// Liste vide = aucun filtrage par IP (seule la clé API protège). Sinon : IP exacte ou plage CIDR IPv4 (ex. 10.20.0.0/24).
export function ipAutorisee(ip: string, liste: any): boolean {
  const actifs = (Array.isArray(liste) ? liste : []).filter((f: any) => f && f.actif !== false && f.ip);
  if (!actifs.length) return true;
  if (!ip) return false;
  const loc = (x: string) => (x === '::1' ? '127.0.0.1' : x);
  const cible = loc(ip);
  return actifs.some((f: any) => {
    const motif = loc(String(f.ip).trim());
    if (motif.includes('/') && estIpv4(cible)) {
      const [base, bits] = motif.split('/');
      const b = parseInt(bits, 10);
      if (!estIpv4(base) || !(b >= 0 && b <= 32)) return false;
      const masque = b === 0 ? 0 : (0xffffffff << (32 - b)) >>> 0;
      return ((versEntier(cible) & masque) >>> 0) === ((versEntier(base) & masque) >>> 0);
    }
    return motif === cible;
  });
}

// Authentifie le frontend public (DMZ) : en-tête x-api-key = clé de la config (ou variable TOURNAGE_API_KEY)
export async function verifierCleApi(req: Request): Promise<boolean> {
  const fournie = req.headers.get('x-api-key') || '';
  const row = await lireConfigTournage();
  const attendue = process.env.TOURNAGE_API_KEY || row.apiKey || '';
  if (!fournie || !attendue) return false;
  if (!ipAutorisee(ipClient(req), row.frontendsAutorises)) return false;
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
    // Horaires par pas de 15 minutes ; véhicules techniques facultatifs (arrivée et départ ensemble)
    const heureOk = (h: string) => RE_HEURE.test(h) && Number(h.split(':')[1]) % 15 === 0;
    for (const [champ, lib] of [['equipeArrivee', "arrivée de l'équipe"], ['equipeDepart', "départ de l'équipe"]] as const) {
      if (!heureOk(txt((j as any)[champ]))) erreurs.push(`${n} : heure de ${lib} invalide (HH:MM, par pas de 15 minutes).`);
    }
    const va = txt(j.vehiculesArrivee), vd = txt(j.vehiculesDepart);
    if (!!va !== !!vd) erreurs.push(`${n} : indiquez l'arrivée et le départ des véhicules techniques (ou aucun des deux).`);
    else if (va && (!heureOk(va) || !heureOk(vd))) erreurs.push(`${n} : horaires des véhicules techniques invalides (HH:MM, par pas de 15 minutes).`);
  });

  const lieu = d?.lieu || {};
  if (!Array.isArray(lieu.emplacements) || !lieu.emplacements.length) erreurs.push('Indiquez le lieu envisagé (trottoir, chaussée, stationnement…).');
  if (!txt(lieu.adresse)) erreurs.push('L\'adresse du lieu de tournage est obligatoire.');

  const plan = Array.isArray(d?.plan) ? d.plan : [];
  if (!plan.length || plan.some((p: any) => !txt(p?.date) || !txt(p?.lieu) || !txt(p?.heures) || !txt(p?.materiel))) {
    erreurs.push('Le plan de tournage doit préciser pour chaque date : lieu, heures et matériel employé.');
  }

  const pers = d?.personnes || {};
  const nbPers = ['equipe', 'comediens', 'figurants', 'autres'].reduce((s, k) => s + (Number(pers[k]) || 0), 0);
  if (nbPers < 1) erreurs.push('Indiquez le nombre de personnes mobilisées (équipe, comédiens, figurants…).');

  const veh = d?.vehicules || {};
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
