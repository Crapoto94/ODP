// Jeu d'exemples : ~30 demandes de tournage variées (références TOU-DEMO-xxxx), pour démonstration / recette.
//   node --openssl-legacy-provider scripts/seed-demandes-tournage.js          → (ré)insère les exemples (supprime d'abord les TOU-DEMO-*)
//   node --openssl-legacy-provider scripts/seed-demandes-tournage.js --purge  → supprime seulement les exemples
// Cible : le schéma de PRODUCTION défini dans config/settings.json.
const path = require('path');
const { PrismaClient } = require('../lib/prisma-client');

const c = require('../config/settings.json').postgres;
const url = `postgresql://${encodeURIComponent(c.user)}:${encodeURIComponent(c.password)}@${c.host}:${c.port}/${c.database}?schema=${c.schema || 'ODP'}`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const DDL = [
  `CREATE TABLE IF NOT EXISTS "DemandeTournage" ("id" SERIAL NOT NULL, "reference" TEXT NOT NULL, "statut" TEXT NOT NULL DEFAULT 'NOUVELLE', "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dateLimiteReponse" TIMESTAMP(3), "premiereDate" TIMESTAMP(3), "derniereDate" TIMESTAMP(3), "societe" TEXT NOT NULL, "demandeurNom" TEXT NOT NULL, "email" TEXT NOT NULL, "telephone" TEXT, "titre" TEXT NOT NULL, "typeFilm" TEXT NOT NULL, "donnees" JSONB NOT NULL, "pieces" JSONB NOT NULL DEFAULT '[]', "notesInternes" TEXT, "occupationId" INTEGER, "traiteePar" TEXT, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "DemandeTournage_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DemandeTournage_reference_key" ON "DemandeTournage"("reference")`,
  `CREATE INDEX IF NOT EXISTS "DemandeTournage_statut_idx" ON "DemandeTournage"("statut")`,
  `CREATE INDEX IF NOT EXISTS "DemandeTournage_dateDepot_idx" ON "DemandeTournage"("dateDepot")`,
];

const SOCIETES = ['Lumière du Sud Productions', 'Atelier 94 Films', 'Seine & Image', 'Kiosque Production', 'Les Films du Pont', 'Brique Rouge Studio', 'Nord-Est Médias', 'Camera Obscura SARL', 'Vitry Ivry Docs', 'Studio Parallèle', 'Orange Bleue Films', 'Faubourg Productions', 'Ciné Banlieue', 'Mirage Publicité', 'Pixel & Pellicule', 'Les Ateliers du Réel', 'Quai 12 Production', 'Horizon Média', 'La Fabrique Sonore', 'Tempo Images', 'ESRA Paris (étudiants)', 'École Louis-Lumière (étudiants)', 'ENS Louis-Lumière - atelier fiction', 'EICAR - promotion 2027', 'Gobelins - projet de fin d\'études', 'Marée Haute Films', 'Grand Angle Production', 'Les Frères Lambert Prod', 'Studio Bleu Nuit', 'Zoom Arrière Films'];
const NOMS = ['Claire Dubois', 'Karim Benali', 'Sophie Martin', 'Julien Moreau', 'Inès Haddad', 'Thomas Leroy', 'Amélie Fontaine', 'Yanis Boucher', 'Camille Roux', 'Mehdi Cherif', 'Laura Petit', 'Antoine Girard', 'Nadia Belkacem', 'Hugo Lambert', 'Elsa Marchand', 'Paul Garnier', 'Sarah Cohen', 'Romain Faure', 'Léa Chevalier', 'Adam Mercier', 'Manon Blanc', 'Nicolas Perrin', 'Jade Morel', 'Samuel Andre', 'Zoé Lefebvre', 'Victor Simon', 'Anaïs Rousseau', 'Maxime Vincent', 'Louise Fabre', 'Bastien Colin'];
const TYPES = ['Fiction', 'Documentaire', 'Reportage', 'Film publicitaire', 'Clip musical', 'Court-métrage', 'Shooting photo', 'Autre'];
const TITRES = ['Les Heures bleues', 'Ivry, mémoire vive', 'Reportage : le marché de la mairie', 'Spot Printemps 2027', 'Clip « Béton »', 'Court-métrage : La Dernière Ligne', 'Shooting automne - collection capsule', 'Série « Quartier Nord » (saison 2)', 'Documentaire : jardins partagés', 'Pub — énergie renouvelable', 'Téléfilm : Une nuit à Ivry', 'Clip « Seine de nuit »', 'Film d\'école : Les Voisins', 'Reportage TV : rénovation urbaine', 'Fiction : Le Facteur', 'Pub automobile - essais routiers', 'Documentaire : artisans d\'Ivry', 'Shooting mode - lookbook', 'Court-métrage : Retour de bal', 'Série web « Colocs »', 'PFE : Silence radio', 'Court d\'école : L\'Escalier', 'Atelier fiction : Lueur', 'Clip étudiant « Périph »', 'Animation + prises de vues réelles', 'Long-métrage : Terre de passage', 'Publicité banque — « Ensemble »', 'Docu-fiction : 1944', 'Série policière « Brigade 94 »', 'Reportage photo : le port d\'Ivry'];
const RUES = [['rue Marat', '12 au 24'], ['avenue Georges Gosnat', '3 au 9'], ['rue Molière', '40 au 52'], ['quai Marcel Boyer', '1 au 15'], ['place Gambetta', 'devant le n° 2'], ['rue Jean-Jacques Rousseau', '18 au 30'], ['avenue de Verdun', '60 au 72'], ['rue Pierre Rigaud', '5 au 11'], ['rue Raspail', '22 au 34'], ['boulevard de Brandebourg', '100 au 118'], ['rue Westermeyer', '7 au 13'], ['rue Victor Hugo', '15 au 21'], ['avenue Danielle Casanova', '2 au 10'], ['rue Barbès', '9 au 17'], ['rue Ernest Renan', '28 au 36']];
const EMPL = [['Trottoir'], ['Chaussée'], ['Places de stationnement'], ['Trottoir', 'Places de stationnement'], ['Chaussée', 'Places de stationnement'], ['Espace vert'], ['Place / parvis'], ['Trottoir', 'Chaussée', 'Places de stationnement'], ['Autre']];
const MATERIEL = ['Éclairage LED, pied de caméra', 'Groupe électrogène, projecteurs HMI', 'Grue, dolly et rails de travelling', 'Caméra à l\'épaule, perche son', 'Travelling sur rails, cantine mobile', 'Drone, nacelle élévatrice', 'Éclairage et machinerie légère', 'Groupe électrogène 20 kVA, camion-loge', 'Steadicam, réflecteurs'];
const VEHICULES = ['2 camions techniques, 1 camion-loge', '1 camion cantine, 1 camion électrogène, 2 utilitaires', '3 camions techniques', '1 camion-loge, 1 camion de régie', '1 utilitaire', '2 camions-loge, 1 camion cantine, 1 groupe électrogène', '4 véhicules légers, 1 camion matériel', '1 semi-remorque matériel, 2 camions-loge'];
const SCENES = ['Scène de poursuite à pied dans la rue, plans larges depuis le trottoir d\'en face.', 'Dialogue en extérieur entre deux personnages, plans fixes et travelling latéral.', 'Interviews d\'habitants et plans de coupe sur l\'architecture du quartier.', 'Plans de voiture en mouvement et arrêt sur image devant la façade.', 'Scène de rassemblement avec figurants, caméra à l\'épaule.', 'Plans de nuit avec éclairage artificiel, ambiance de rue déserte.', 'Prise de vues d\'une marche collective suivie d\'un discours sur la place.', 'Séquence de course à vélo et échange de colis, plans serrés.'];
const SYNOPSIS = ['Deux anciens amis se retrouvent par hasard dans une ville qui a changé, et doivent régler un vieux différend avant la fin de la nuit.', 'Portrait d\'une ville en transformation à travers le regard de ses habitants, commerçants et artisans, sur une année.', 'Une jeune photographe documente la rénovation de son quartier et découvre l\'histoire cachée d\'un immeuble.', 'Film publicitaire mettant en scène une famille dans son quotidien urbain, ton léger et chaleureux.', 'Un facteur découvre une lettre jamais distribuée qui le mène à travers tout le quartier.', 'Clip musical tourné en plans-séquences dans des rues emblématiques, entre béton et lumière rasante.'];
const STATUTS = ['NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'NOUVELLE', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'EN_INSTRUCTION', 'COMPLEMENT', 'COMPLEMENT', 'COMPLEMENT', 'ACCORD', 'ACCORD', 'ACCORD', 'ACCORD', 'ACCORD', 'ACCORD', 'REFUSEE', 'REFUSEE', 'REFUSEE', 'ANNULEE', 'ANNULEE'];

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ajoutJours = (d, n) => { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() + n); return r; };
function ajoutOuvres(d, n) { let r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); while (n > 0) { r = ajoutJours(r, 1); if (r.getDay() !== 0 && r.getDay() !== 6) n--; } return r; }
const pick = (arr, i) => arr[i % arr.length];

const PIECE = (kind, libelle, nom) => ({ kind, libelle, nom, chemin: '/demo/attestation-exemple.pdf', taille: 1100 });

function construire(i) {
  const etudiant = i >= 20 && i <= 24;
  const aujourdhui = new Date();
  const depot = ajoutJours(aujourdhui, -((i * 37) % 45) - 1);
  const statut = STATUTS[i];
  const nbJours = 1 + (i % 4);
  const debut = ajoutJours(ajoutOuvres(depot, 15), 3 + ((i * 11) % 60));
  const jours = Array.from({ length: nbJours }, (_, k) => {
    const dj = ajoutJours(debut, k * (1 + (i % 2)));
    const h0 = 6 + (i % 5);
    return { date: iso(dj), equipeArrivee: `${pad(h0)}:00`, equipeDepart: `${pad(h0 + 9 + (k % 3))}:30`, vehiculesArrivee: `${pad(h0 - 1 < 5 ? 5 : h0 - 1)}:30`, vehiculesDepart: `${pad(h0 + 10 + (k % 3))}:30` };
  });
  const [rue, numeros] = pick(RUES, i * 3 + 1);
  const societe = pick(SOCIETES, i);
  const nom = pick(NOMS, i * 7 + 3);
  const mail = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '.');
  const domaine = societe.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 14);
  const drone = i % 7 === 3, passerelle = i % 11 === 5, cormailles = i % 9 === 4;
  const violence = i % 8 === 6, armes = i % 13 === 6;
  const donnees = {
    demandeur: { societe, nom, email: `${mail}@${domaine}.fr`, telephone: `01 ${pad(40 + (i % 50))} ${pad((i * 7) % 100)} ${pad((i * 13) % 100)} ${pad((i * 17) % 100)}` },
    titre: pick(TITRES, i), typeFilm: etudiant ? 'Court-métrage' : pick(TYPES, i * 3 + 2),
    synopsis: pick(SYNOPSIS, i), scenes: pick(SCENES, i * 5 + 1),
    violence, armesFactices: armes,
    jours,
    lieu: { emplacements: pick(EMPL, i * 2 + 1), adresse: `${rue}, Ivry-sur-Seine`, precisions: i % 3 === 0 ? 'Accès pompiers à conserver' : '' },
    plan: jours.map((j, k) => ({ date: j.date, lieu: `${rue} (${numeros})`, heures: `${j.equipeArrivee.replace(':00', 'h').replace(':30', 'h30')} – ${j.equipeDepart.replace(':00', 'h').replace(':30', 'h30')}`, materiel: pick(MATERIEL, i + k) })),
    personnes: { equipe: 4 + ((i * 3) % 30), comediens: i % 6, figurants: (i % 5) * 4, autres: i % 4 === 0 ? 2 + (i % 5) : 0, autresPrecision: i % 4 === 0 ? 'agents de sécurité' : '' },
    vehicules: { description: pick(VEHICULES, i * 2), nbPlaces: 1 + ((i * 5) % 12), localisation: `${rue}, du n° ${numeros.replace(' au ', ' au n° ')}` },
    etudiant, ecole: etudiant ? { nom: societe, contact: 'Secrétariat pédagogique', telephone: '01 44 12 34 56', email: 'scolarite@ecole-exemple.fr' } : null,
    cas: { drone, passerelle, cormailles }, accepte: true,
  };
  const pieces = [PIECE('ASSURANCE', "Attestation d'assurance", 'assurance.pdf'), PIECE('PLAN', 'Plan de localisation du matériel et des véhicules', 'plan-1-200.pdf')];
  if (etudiant) pieces.push(PIECE('ECOLE', "Attestation de l'école", 'attestation-ecole.pdf'));
  const notes = { COMPLEMENT: 'Demande de précision sur le plan de stationnement (rue étroite).', ACCORD: 'Rendez-vous sur site effectué. Accord de principe avec réserves : maintien d\'un cheminement piéton, avis aux riverains à distribuer 5 jours avant.', REFUSEE: 'Refus : emplacement incompatible avec les travaux de voirie en cours.', ANNULEE: 'Annulée à la demande de la production.' }[statut] || null;
  return {
    reference: `TOU-DEMO-${String(i + 1).padStart(4, '0')}`,
    statut, dateDepot: depot, dateLimiteReponse: ajoutOuvres(depot, 15),
    premiereDate: new Date(jours[0].date + 'T00:00:00'), derniereDate: new Date(jours[jours.length - 1].date + 'T00:00:00'),
    societe, demandeurNom: nom, email: donnees.demandeur.email, telephone: donnees.demandeur.telephone,
    titre: donnees.titre, typeFilm: donnees.typeFilm, donnees, pieces,
    notesInternes: notes ? `[Exemple] ${notes}` : '[Exemple] Donnée de démonstration',
    traiteePar: ['EN_INSTRUCTION', 'COMPLEMENT', 'ACCORD', 'REFUSEE', 'ANNULEE'].includes(statut) ? 'Instructeur Démo' : null,
  };
}

(async () => {
  try {
    for (const q of DDL) await prisma.$executeRawUnsafe(q);
    const sup = await prisma.demandeTournage.deleteMany({ where: { reference: { startsWith: 'TOU-DEMO-' } } });
    console.log(`Exemples supprimés : ${sup.count}`);
    if (process.argv.includes('--purge')) return;
    for (let i = 0; i < 30; i++) await prisma.demandeTournage.create({ data: construire(i) });
    const par = await prisma.demandeTournage.groupBy({ by: ['statut'], _count: true, where: { reference: { startsWith: 'TOU-DEMO-' } } });
    console.log('Exemples créés : 30 —', par.map((p) => `${p.statut}: ${p._count}`).join(', '));
  } finally { await prisma.$disconnect(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
