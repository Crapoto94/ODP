/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/enrich_siret.js
 *
 * Pour chaque Tiers sans SIRET, interroge l'API publique
 * https://recherche-entreprises.api.gouv.fr (basée sur Sirene/INSEE)
 * et tente de retrouver le SIRET du siège ou d'un établissement
 * dont le nom est >=80% similaire ET dont l'adresse correspond.
 *
 * Usage :
 *   node scripts/enrich_siret.js --dry-run            # défaut, n'écrit rien
 *   node scripts/enrich_siret.js --apply              # applique réellement les UPDATE
 *   node scripts/enrich_siret.js --limit 20           # ne traite que 20 tiers
 *   node scripts/enrich_siret.js --ids 411,412,413    # uniquement ces tiers
 *   node scripts/enrich_siret.js --apply --threshold 0.80
 *
 * Sortie : un CSV de rapport dans scripts/enrich_siret_report.csv
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const stringSimilarity = require('string-similarity');

// On utilise le client Prisma généré dans lib/prisma-client (cf. schema.prisma)
const { PrismaClient } = require(path.join(__dirname, '..', 'lib', 'prisma-client'));
const prisma = new PrismaClient();

// ---------- CLI ----------
const argv = process.argv.slice(2);
const hasFlag = (f) => argv.includes(f);
const valueOf = (f, def) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const APPLY = hasFlag('--apply');
const DRY_RUN = !APPLY;
const LIMIT = parseInt(valueOf('--limit', '0'), 10) || null;
const ONLY_IDS = (valueOf('--ids', '') || '')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !isNaN(n));
const THRESHOLD = parseFloat(valueOf('--threshold', '0.80'));
const NAME_MIN = parseFloat(valueOf('--name-min', '0.80'));
const ADDR_MIN = parseFloat(valueOf('--addr-min', '0.60'));
const SLEEP_MS = parseInt(valueOf('--sleep', '180'), 10); // ~5 req/s
const REPORT_PATH = path.join(__dirname, 'enrich_siret_report.csv');

// ---------- Utilitaires ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripAccents(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function normalize(s) {
  return stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/[\.\,\;\:\!\?\(\)\[\]"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Suffixes de forme juridique à retirer pour la comparaison de NOM
const LEGAL_SUFFIXES = [
  'sarl', 'sas', 'sasu', 'sa', 'snc', 'sci', 'eurl', 'scop', 'scp', 'gie',
  'ei', 'eirl', 'ets', 'etablissements', 'societe', 'cie', 'co',
];
const HONORIFICS = ['m', 'mr', 'mme', 'mlle', 'monsieur', 'madame', 'mademoiselle'];

function normalizeName(n) {
  let s = normalize(n);
  // retire les ponctuations spéciales restantes
  s = s.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ').filter((t) => t && !LEGAL_SUFFIXES.includes(t) && !HONORIFICS.includes(t));
  return tokens.join(' ').trim();
}

// Abréviations d'adresse → forme longue
const ADDR_ABBREV = {
  ave: 'avenue', av: 'avenue', bd: 'boulevard', boul: 'boulevard',
  pla: 'place', pl: 'place', rte: 'route', rt: 'route',
  all: 'allee', imp: 'impasse', sq: 'square', chem: 'chemin',
  rue: 'rue', che: 'chemin', fbg: 'faubourg', pas: 'passage',
  qua: 'quai', sen: 'sentier', voie: 'voie',
};

function normalizeAddress(a) {
  let s = normalize(String(a || '').replace(/[\n\r]+/g, ' '));
  s = s.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ').map((t) => ADDR_ABBREV[t] || t);
  return tokens.join(' ').trim();
}

// Extrait code postal (5 chiffres FR) et ville d'une adresse
function extractCpVille(adresse) {
  if (!adresse) return { cp: null, ville: null, rue: null };
  const cleaned = adresse.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/(.*?)\s*(\d{5})\s+(.+)$/);
  if (m) {
    return {
      rue: m[1].trim().replace(/[,;]+$/g, '').trim(),
      cp: m[2],
      ville: m[3].trim(),
    };
  }
  return { cp: null, ville: null, rue: cleaned };
}

// ---------- API Sirene (recherche-entreprises) ----------
async function searchEntreprises(params) {
  const url = 'https://recherche-entreprises.api.gouv.fr/search';
  try {
    const res = await axios.get(url, { params, timeout: 12000 });
    return res.data && res.data.results ? res.data.results : [];
  } catch (err) {
    const status = err.response?.status;
    if (status === 429) {
      // Rate limit, on attend un peu plus
      await sleep(2000);
      return searchEntreprises(params);
    }
    console.warn(`[API] Erreur ${status || err.code}: ${err.message}`);
    return [];
  }
}

function flattenEtablissements(result) {
  const out = [];
  if (result.siege) out.push({ ...result.siege, _isSiege: true });
  if (Array.isArray(result.matching_etablissements)) {
    for (const e of result.matching_etablissements) {
      if (!result.siege || e.siret !== result.siege.siret) {
        out.push({ ...e, _isSiege: false });
      }
    }
  }
  return out;
}

// ---------- Scoring ----------
function scoreName(tiersNom, apiNom) {
  const a = normalizeName(tiersNom);
  const b = normalizeName(apiNom);
  if (!a || !b) return 0;
  // string-similarity utilise Dice's coefficient sur bigrammes — robuste
  const s = stringSimilarity.compareTwoStrings(a, b);
  // Bonus si l'un contient l'autre entièrement
  if (a.length >= 4 && b.includes(a)) return Math.max(s, 0.92);
  if (b.length >= 4 && a.includes(b)) return Math.max(s, 0.92);
  return s;
}

function scoreAddress(tiersAdr, apiAdr, tiersCp, apiCp, tiersVille, apiVille) {
  const a = normalizeAddress(tiersAdr);
  const b = normalizeAddress(apiAdr);
  const cpMatch = tiersCp && apiCp && tiersCp === apiCp;
  const villeMatch =
    tiersVille && apiVille &&
    normalize(tiersVille) === normalize(apiVille);

  let s = 0;
  if (a && b) s = stringSimilarity.compareTwoStrings(a, b);

  if (cpMatch) s = Math.max(s, 0.6) + 0.1;
  if (villeMatch) s += 0.05;
  return Math.min(s, 1);
}

// ---------- Cœur ----------
async function findBestMatch(tier) {
  const { cp, ville, rue } = extractCpVille(tier.adresse);
  const cleanedName = normalizeName(tier.nom);
  if (!cleanedName) return null;

  const queries = [];

  // 1) Recherche stricte avec CP (siège ET établissements)
  if (cp) queries.push({ q: cleanedName, code_postal: cp, per_page: 10 });
  // 2) Recherche avec ville
  if (ville) queries.push({ q: `${cleanedName} ${ville}`, per_page: 10 });
  // 3) Recherche large
  queries.push({ q: cleanedName, per_page: 10 });

  let bestCandidate = null;

  for (const params of queries) {
    const results = await searchEntreprises(params);
    if (!results.length) continue;

    for (const r of results) {
      const apiName = r.nom_complet || r.nom_raison_sociale || '';
      const nameSc = scoreName(tier.nom, apiName);
      // skip rapidement si nom trop éloigné
      if (nameSc < NAME_MIN - 0.15) continue;

      const etablissements = flattenEtablissements(r);
      for (const et of etablissements) {
        const apiAdr = et.adresse || '';
        const apiCp = et.code_postal || null;
        const apiVille = et.libelle_commune || null;
        const addrSc = scoreAddress(rue, apiAdr, cp, apiCp, ville, apiVille);
        const combined = nameSc * 0.6 + addrSc * 0.4;

        const cand = {
          siret: et.siret,
          apiName,
          apiAdresse: apiAdr,
          apiCp,
          apiVille,
          isSiege: et._isSiege,
          etat: et.etat_administratif,
          nameSc, addrSc, combined,
        };
        if (!bestCandidate || combined > bestCandidate.combined) {
          bestCandidate = cand;
        }
      }
    }
    // Si on a déjà un excellent match, pas besoin d'élargir
    if (bestCandidate && bestCandidate.combined >= 0.95) break;
    await sleep(SLEEP_MS);
  }

  return bestCandidate;
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

async function main() {
  console.log('=== Enrichissement SIRET ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (lecture seule)' : 'APPLY (mise à jour)'}`);
  console.log(`Seuil combiné: ${THRESHOLD}, name>=${NAME_MIN}, addr>=${ADDR_MIN}`);

  const where = ONLY_IDS.length
    ? { id: { in: ONLY_IDS } }
    : { OR: [{ siret: null }, { siret: '' }] };

  const tiers = await prisma.tiers.findMany({
    where,
    orderBy: { id: 'asc' },
    take: LIMIT || undefined,
  });

  console.log(`${tiers.length} tiers à traiter.\n`);

  const reportRows = [
    [
      'tiersId', 'nom', 'adresse', 'siret_existant',
      'siret_trouve', 'api_nom', 'api_adresse', 'is_siege',
      'name_score', 'addr_score', 'combined_score',
      'action', 'note',
    ].join(','),
  ];

  let updated = 0, skipped = 0, noMatch = 0, errors = 0;

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const prefix = `[${i + 1}/${tiers.length}] #${t.id}`;
    process.stdout.write(`${prefix} ${t.nom?.slice(0, 40).padEnd(40)} ... `);

    let action = 'NO_MATCH';
    let note = '';
    let cand = null;

    try {
      cand = await findBestMatch(t);
    } catch (e) {
      errors++;
      note = `error: ${e.message}`;
      console.log('ERREUR');
      reportRows.push([
        t.id, t.nom, t.adresse, t.siret || '',
        '', '', '', '',
        '', '', '',
        'ERROR', note,
      ].map(csvEscape).join(','));
      continue;
    }

    if (!cand) {
      noMatch++;
      console.log('aucun candidat');
    } else if (
      cand.combined >= THRESHOLD &&
      cand.nameSc >= NAME_MIN &&
      cand.addrSc >= ADDR_MIN
    ) {
      // Vérifie qu'aucun autre tiers n'a déjà ce SIRET (contrainte unique)
      const dup = await prisma.tiers.findUnique({ where: { siret: cand.siret } });
      if (dup && dup.id !== t.id) {
        action = 'SKIP_DUPLICATE';
        skipped++;
        note = `siret déjà utilisé par tiers #${dup.id}`;
        console.log(`SKIP (déjà sur #${dup.id})`);
      } else {
        action = APPLY ? 'UPDATED' : 'WOULD_UPDATE';
        if (APPLY) {
          await prisma.tiers.update({
            where: { id: t.id },
            data: {
              siret: cand.siret,
              etatAdministratif: cand.etat === 'A' ? 'Actif' : (cand.etat === 'C' ? 'Cessée' : null),
            },
          });
        }
        updated++;
        console.log(
          `${cand.siret} (n=${cand.nameSc.toFixed(2)} a=${cand.addrSc.toFixed(2)} c=${cand.combined.toFixed(2)})`
        );
      }
    } else {
      skipped++;
      action = 'BELOW_THRESHOLD';
      note = `n=${cand.nameSc.toFixed(2)} a=${cand.addrSc.toFixed(2)} c=${cand.combined.toFixed(2)}`;
      console.log(`bas: ${note}`);
    }

    reportRows.push(
      [
        t.id, t.nom, t.adresse, t.siret || '',
        cand?.siret || '',
        cand?.apiName || '',
        cand?.apiAdresse || '',
        cand?.isSiege ? '1' : '0',
        cand?.nameSc?.toFixed(3) || '',
        cand?.addrSc?.toFixed(3) || '',
        cand?.combined?.toFixed(3) || '',
        action, note,
      ].map(csvEscape).join(',')
    );

    await sleep(SLEEP_MS);
  }

  fs.writeFileSync(REPORT_PATH, reportRows.join('\n'), 'utf8');

  console.log('\n=== Résumé ===');
  console.log(`Mis à jour : ${updated} ${DRY_RUN ? '(simulation)' : ''}`);
  console.log(`Ignorés    : ${skipped}`);
  console.log(`Sans match : ${noMatch}`);
  console.log(`Erreurs    : ${errors}`);
  console.log(`Rapport    : ${REPORT_PATH}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
