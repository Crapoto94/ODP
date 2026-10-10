// Import des barèmes de tournage manquants dans Tarifs & Articles (idempotent) :
//  - bâtiments publics (délibération du 13/02/2025, tarifs à compter du 1er mars 2025)  → articles 7.xx
//  - équipements sportifs, tournages de films et prises de vues (2024/2025 et 2025/2026, identiques) → articles 8.xx
// Le barème voirie 2026 (articles 2.18-2.20 et 4.01-4.11) est déjà en base.
//   node --openssl-legacy-provider scripts/import-tarifs-tournage.js          → crée les articles manquants (2025 et 2026)
//   node --openssl-legacy-provider scripts/import-tarifs-tournage.js --dry    → affiche sans écrire
const { PrismaClient } = require('../lib/prisma-client');
const c = require('../config/settings.json').postgres;
const prisma = new PrismaClient({ datasources: { db: { url: `postgresql://${encodeURIComponent(c.user)}:${encodeURIComponent(c.password)}@${c.host}:${c.port}/${c.database}?schema=${c.schema || 'ODP'}` } } });
const DRY = process.argv.includes('--dry');
const ANNEES = [2025, 2026];

// [numero, désignation, montant, mode de taxation]
const BATIMENTS = [
  ['7.01', 'Bâtiment public - une journée en semaine - tournage', 550, 'forfaitaire/jour'],
  ['7.02', 'Bâtiment public - la nuit, le dimanche et les jours fériés - tournage', 900, 'forfaitaire/jour'],
  ['7.03', 'Bâtiment public - une demi-journée en semaine - tournage', 250, 'forfaitaire/jour'],
  ['7.04', 'Bâtiment public - une demi-nuit, une demi-journée le dimanche ou les jours fériés - tournage', 400, 'forfaitaire/jour'],
  ['7.05', "Bâtiment public - une journée d'occupation sans tournage", 250, 'forfaitaire/jour'],
  ['7.06', 'Bâtiment public - forfait équipe de 1 à 10 personnes - tournage', 0, 'forfaitaire/jour'],
  ['7.07', 'Bâtiment public - forfait équipe de 11 à 20 personnes - tournage', 500, 'forfaitaire/jour'],
  ['7.08', 'Bâtiment public - forfait équipe de 21 à 50 personnes - tournage', 900, 'forfaitaire/jour'],
  ['7.09', 'Bâtiment public - forfait équipe de plus de 50 personnes - tournage', 1400, 'forfaitaire/jour'],
];
const SPORTS = [
  ['8.01', 'Equipement sportif - bassin piscine municipale (grand bassin + petit bassin) - tournage', 904.18, '/h'],
  ['8.02', 'Equipement sportif - gymnase, salle d\'escrime, tennis de table, bulle de tennis - tournage', 214.55, '/h'],
  ['8.03', 'Equipement sportif - salle de sport, de combat, gymnase scolaire, salle de musculation - tournage', 107.91, '/h'],
  ['8.04', 'Equipement sportif - stade créneau diurne (8h00 à 18h00) - tournage', 313.52, 'forfaitaire/jour'],
  ['8.05', 'Equipement sportif - stade créneau nocturne (à partir de 18h00) - tournage', 624.74, 'forfaitaire/jour'],
  ['8.06', 'Equipement sportif - court de tennis municipal - tournage', 51.22, '/h'],
  ['8.07', "Equipement sportif - plateau d'évolution, équipe jusqu'à 10 personnes (taux journée) - tournage", 311.2, 'forfaitaire/jour'],
  ['8.08', "Equipement sportif - plateau d'évolution, équipe de 11 à 20 personnes (taux journée) - tournage", 622.3, 'forfaitaire/jour'],
  ['8.09', "Equipement sportif - plateau d'évolution, équipe de 21 à 30 personnes (taux journée) - tournage", 792.25, 'forfaitaire/jour'],
  ['8.10', "Equipement sportif - plateau d'évolution, équipe de 31 à 80 personnes (taux journée) - tournage", 961.1, 'forfaitaire/jour'],
  ['8.11', "Equipement sportif - plateau d'évolution, équipe de 81 à 150 personnes (taux journée) - tournage", 1141.65, 'forfaitaire/jour'],
  ['8.12', "Equipement sportif - plateau d'évolution, équipe de plus de 150 personnes (taux journée) - tournage", 1358.3, 'forfaitaire/jour'],
  ['8.13', 'Equipement sportif - supplément en cas de tournage entre 20h00 et 8h00 - tournage', 396.1, 'forfaitaire/jour'],
];

(async () => {
  try {
    const parent = await prisma.categorie.findFirst({ where: { nom: 'TOURNAGE', niveau: 2 } });
    if (!parent) throw new Error('Catégorie TOURNAGE (niveau 2) introuvable');
    const modes = Object.fromEntries((await prisma.modeTaxation.findMany()).map((m) => [m.nom, m.id]));
    const modele = await prisma.article.findFirst({ where: { annee: 2026, designation: { startsWith: "Equipe jusqu'à 10" } } });
    const copie = modele ? { chapitre: modele.chapitre, codeInterne: modele.codeInterne, fonction: modele.fonction, gestionnaire: modele.gestionnaire, nature: modele.nature, sens: modele.sens, structure: modele.structure, typeMouvement: modele.typeMouvement } : {};
    console.log('Codes de gestion copiés depuis :', modele ? modele.designation : '(aucun modèle)');

    const categorie = async (nom) => {
      let cat = await prisma.categorie.findFirst({ where: { nom, parentId: parent.id } });
      if (!cat && !DRY) cat = await prisma.categorie.create({ data: { nom, niveau: 3, parentId: parent.id, couleur: parent.couleur } });
      return cat;
    };
    const catBat = await categorie('BATIMENTS PUBLICS TOURNAGE');
    const catSport = await categorie('EQUIPEMENTS SPORTIFS TOURNAGE');

    let crees = 0, existants = 0;
    for (const [cat, liste] of [[catBat, BATIMENTS], [catSport, SPORTS]]) {
      for (const annee of ANNEES) {
        for (const [numero, designation, montant, mode] of liste) {
          const deja = await prisma.article.findFirst({ where: { annee, numero, designation } });
          if (deja) { existants++; continue; }
          if (!(mode in modes)) throw new Error(`Mode de taxation inconnu : ${mode}`);
          console.log(`${DRY ? '[dry] ' : ''}${annee} ${numero} ${montant} € (${mode}) ${designation}`);
          if (!DRY) await prisma.article.create({ data: { numero, designation, annee, montant, categorieId: cat.id, modeTaxationId: modes[mode], ...copie } });
          crees++;
        }
      }
    }
    console.log(`Articles ${DRY ? 'à créer' : 'créés'} : ${crees} — déjà présents : ${existants}`);
  } finally { await prisma.$disconnect(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
