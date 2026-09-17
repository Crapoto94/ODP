/*
 * Migration des lignes SURES presentes uniquement dans ODP_DEV vers ODP (PROD).
 *
 * Contexte : le toggle de mode DB (Parametres > mode DEV/PROD) est un
 * reglage GLOBAL (config/settings.json), pas par utilisateur. A chaque
 * fois qu'un admin bascule en DEV pour tester, TOUTE l'application (tous
 * les utilisateurs) se met a lire/ecrire dans ODP_DEV. Le travail saisi
 * pendant ces fenetres reste coince dans ODP_DEV et disparait de la prod
 * des que quelqu'un repasse en PROD.
 *
 * Ce script ne migre QUE le sous-ensemble sans ambiguite : tiers/occupations
 * qui n'ont AUCUN equivalent deja present en PROD (ni meme SIRET/code_sedit,
 * ni occupations existantes pour ce tiers). Tout ce qui ressemble a un
 * doublon (meme SIRET/code_sedit sous un autre id, ou un tiers qui a deja
 * des occupations en PROD, ou toute facturation) est explicitement exclu
 * et laisse pour revue manuelle -- voir tmp/scratch/classification.json.
 *
 * Le perimetre migre (tmp/scratch/safe_scope.json) est calcule par
 * scripts/... (classify_all_v2.cjs + build_safe_scope.cjs) :
 *   - Tiers entierement nouveaux (aucune collision siret/code_sedit)
 *   - Leurs Occupations
 *   - Contact/Note qui ne referencent que des tiers/occupations surs
 *   - LigneOccupation dont l'occupation est sure
 *   - PAS d'Autorisation, PAS de SignatureRequest, PAS de facturation
 *     (BillingRun/BillingRunInvoice) : ces tables touchent uniquement des
 *     occupations partagees ou a risque, ecartees par prudence.
 *
 * Securites :
 *   - DRY-RUN par defaut (--apply pour ecrire)
 *   - sauvegarde JSON de tout ce qui est insere avant d'ecrire
 *   - une seule transaction pour l'ensemble
 *
 * Usage :
 *   node scripts/migrate-dev-orphans-to-prod.cjs [--apply]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'settings.json'), 'utf8')).postgres;
  const PROD = cfg.schema || 'ODP';
  const DEV = cfg.schemaDev || 'ODP_DEV';

  const scope = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'scratch', 'safe_scope.json'), 'utf8'));

  const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database });
  await client.connect();

  console.log(`[MIGRATE-SAFE] PROD=${PROD} DEV=${DEV} apply=${APPLY}`);

  const plan = {
    Tiers: scope.brandNewTiersIds,
    Occupation: scope.safeOccIds,
    Contact: scope.contactSafeIds,
    Note: scope.noteSafeIds,
    LigneOccupation: scope.ligneOccupationSafeIds,
  };
  for (const [t, ids] of Object.entries(plan)) console.log(`  ${t}: ${ids.length} ligne(s) a migrer`);

  const totalRows = Object.values(plan).reduce((a, b) => a + b.length, 0);
  if (!totalRows) { console.log('[MIGRATE-SAFE] Rien a migrer.'); await client.end(); return; }

  const columnsByTable = {};
  for (const t of Object.keys(plan)) {
    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [DEV, t]
    );
    columnsByTable[t] = colsRes.rows.map((r) => r.column_name);
  }

  const backup = {};
  for (const [t, ids] of Object.entries(plan)) {
    if (!ids.length) { backup[t] = []; continue; }
    const cols = columnsByTable[t].map((c) => `"${c}"`).join(', ');
    const res = await client.query(`SELECT ${cols} FROM "${DEV}"."${t}" WHERE id = ANY($1::int[])`, [ids]);
    backup[t] = res.rows;
  }
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupFile = path.join(process.cwd(), 'tmp', `migrate-safe-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`[MIGRATE-SAFE] Sauvegarde ecrite : ${backupFile}`);

  if (!APPLY) {
    console.log('\n[MIGRATE-SAFE] DRY-RUN : aucune ecriture. Relancer avec --apply pour appliquer.');
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    for (const [t, ids] of Object.entries(plan)) {
      if (!ids.length) continue;
      const colList = columnsByTable[t].map((c) => `"${c}"`).join(', ');
      const res = await client.query(
        `INSERT INTO "${PROD}"."${t}" (${colList}) SELECT ${colList} FROM "${DEV}"."${t}" WHERE id = ANY($1::int[])`,
        [ids]
      );
      console.log(`[MIGRATE-SAFE] ${t}: ${res.rowCount} ligne(s) inseree(s) dans ${PROD}`);
    }
    await client.query('COMMIT');
    console.log(`\n[MIGRATE-SAFE] OK : ${totalRows} ligne(s) migree(s) au total.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATE-SAFE] ECHEC, rollback effectue :', err.message);
    throw err;
  }

  await client.end();
}

main().catch((e) => {
  console.error('[MIGRATE-SAFE] Erreur fatale :', e.message);
  process.exit(1);
});
