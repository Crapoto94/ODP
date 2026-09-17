/*
 * Nettoyage des doublons ODP_DEV devenus obsoletes.
 *
 * Apres scripts/migrate-dev-orphans-to-prod.cjs (vague 1) et
 * scripts/migrate-wave2-complete-and-attachments.cjs (vague 2), tout ce qui
 * avait une valeur unique cote ODP_DEV a ete recupere dans ODP (PROD).
 *
 * Ce qui reste orphelin dans ODP_DEV a ce stade est, par construction,
 * SANS valeur :
 *   - 13 tiers dupliques par SIRET/code_sedit, deja recrees en PROD sous un
 *     autre id (leurs occupations/notes utiles ont deja ete migrees)
 *   - les occupations "doublon d'annee deja existante en PROD" pour ces
 *     tiers et pour les tiers deja partages entre les deux schemas
 *   - la facturation FACT-2026-07-02-1334 (GABOSAND), dont le numerotage
 *     entre en conflit avec la facturation deja en PROD -- decision
 *     explicite : on ne conserve que PROD
 *
 * Ce script supprime UNIQUEMENT des lignes de ODP_DEV : il ne touche jamais
 * a ODP (PROD). Comme les deux schemas sont independants, un id partage
 * entre les deux (ex: une occupation deja migree avec le meme id) n'est
 * jamais affecte -- seule la copie ODP_DEV disparait.
 *
 * Perimetre exact = tmp/scratch/cleanup_scope_raw.json (tout ce qui est
 * encore "dev-only" apres les deux vagues de migration).
 *
 * Securites : DRY-RUN par defaut, sauvegarde JSON complete avant
 * suppression, transaction unique, ordre de suppression respectant les
 * contraintes de cle etrangere (enfants avant parents).
 *
 * Usage : node scripts/cleanup-dev-duplicates.cjs [--apply]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');

// Ordre de suppression = enfants avant parents
const DELETE_ORDER = ['LigneOccupation', 'Autorisation', 'SignatureRequest', 'BillingRunInvoice', 'BillingRun', 'Note', 'Contact', 'Occupation', 'Tiers'];

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'settings.json'), 'utf8')).postgres;
  const DEV = cfg.schemaDev || 'ODP_DEV';
  const scope = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'scratch', 'cleanup_scope_raw.json'), 'utf8'));

  const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database });
  await client.connect();
  console.log(`[CLEANUP] DEV=${DEV} apply=${APPLY}`);

  for (const t of DELETE_ORDER) console.log(`  ${t}: ${(scope[t] || []).length} ligne(s) a supprimer`);

  const totalRows = DELETE_ORDER.reduce((a, t) => a + (scope[t] || []).length, 0);
  if (!totalRows) { console.log('[CLEANUP] Rien a supprimer.'); await client.end(); return; }

  // Sauvegarde complete avant toute suppression
  const backup = {};
  for (const t of DELETE_ORDER) {
    const ids = scope[t] || [];
    if (!ids.length) { backup[t] = []; continue; }
    const idType = t === 'BillingRun' ? 'text' : 'int';
    backup[t] = (await client.query(`SELECT * FROM "${DEV}"."${t}" WHERE id = ANY($1::${idType}[])`, [ids])).rows;
  }
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupFile = path.join(process.cwd(), 'tmp', `cleanup-dev-duplicates-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`[CLEANUP] Sauvegarde ecrite : ${backupFile}`);

  if (!APPLY) { console.log('\n[CLEANUP] DRY-RUN : aucune suppression. Relancer avec --apply.'); await client.end(); return; }

  await client.query('BEGIN');
  try {
    for (const t of DELETE_ORDER) {
      const ids = scope[t] || [];
      if (!ids.length) continue;
      const idType = t === 'BillingRun' ? 'text' : 'int';
      const res = await client.query(`DELETE FROM "${DEV}"."${t}" WHERE id = ANY($1::${idType}[])`, [ids]);
      console.log(`[CLEANUP] ${t}: ${res.rowCount} ligne(s) supprimee(s)`);
    }
    await client.query('COMMIT');
    console.log(`\n[CLEANUP] OK : ${totalRows} ligne(s) supprimee(s) au total (ODP_DEV uniquement, ODP non touche).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CLEANUP] ECHEC, rollback effectue :', err.message);
    throw err;
  }

  await client.end();
}

main().catch((e) => { console.error('[CLEANUP] Erreur fatale :', e.message); process.exit(1); });
