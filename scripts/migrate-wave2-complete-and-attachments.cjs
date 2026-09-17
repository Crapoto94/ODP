/*
 * Vague 2 de recuperation ODP_DEV -> ODP.
 *
 * Suite a scripts/migrate-dev-orphans-to-prod.cjs (vague 1, perimetre "zero
 * ambiguite"), cette vague traite le reste des 100 tiers a doublon potentiel
 * mais SANS toucher a la moindre annee deja facturee ni recreer de doublon :
 *
 *   A) "COMPLETER PROD" (80 tiers, 161 occupations) : annees presentes
 *      UNIQUEMENT en DEV pour un tiers deja existant en PROD (aucune de ces
 *      annees n'existe deja en PROD, facturee ou non) -> on les ajoute.
 *      + leurs LigneOccupation et Notes rattachees par occupationId.
 *   B) "RECUPERER PIECES JOINTES" (13 tiers, 36 notes) : documents (CERFA,
 *      autorisations, plans...) uniquement en DEV pour des tiers dont le
 *      dossier existe deja en PROD sous un autre id -> on rattache la note
 *      au bon tiers PROD (tiersId remappe), sans toucher aux occupations.
 *
 * Explicitement EXCLU (voir tmp/scratch/risky_analysis_v2.json) :
 *   - GABOSAND (tiers #829) : conflit de numerotation de facture, PROD
 *     conserve tel quel sur decision explicite.
 *   - 7 tiers "doublon sans enjeu" : rien d'unique cote DEV, aucune action.
 *   - Toute annee deja facturee (statut FACTURE) des deux cotes : jamais
 *     touchee par ce script.
 *
 * Le tiersId est remappe (dev -> prod) uniquement pour les 13 tiers
 * dupliques par SIRET/code_sedit ; pour les autres, dev et prod partagent
 * deja le meme id de tiers.
 *
 * Securites : DRY-RUN par defaut, sauvegarde JSON, transaction unique.
 * Usage : node scripts/migrate-wave2-complete-and-attachments.cjs [--apply]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'settings.json'), 'utf8')).postgres;
  const PROD = cfg.schema || 'ODP';
  const DEV = cfg.schemaDev || 'ODP_DEV';
  const scope = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'scratch', 'wave2_scope.json'), 'utf8'));

  const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database });
  await client.connect();
  console.log(`[WAVE2] PROD=${PROD} DEV=${DEV} apply=${APPLY}`);

  const occIds = scope.occIds;
  const tiersIdMap = scope.tiersIdMap; // devOccId -> prodTiersId (per occupation, covers remap)
  const devTiersToProd = scope.devTiersToProd; // devTiersId -> prodTiersId (for Note.tiersId remap)
  const noteIdsForOcc = scope.noteRowsForOcc;
  const ligneIds = scope.ligneRows;
  const noteIdsAttachments = scope.noteIdsToAdd;
  const notesToAddMap = Object.fromEntries(scope.notesToAdd.map(n => [n.devNoteId, n.prodTiersId]));

  console.log(`  Occupation: ${occIds.length}`);
  console.log(`  Note (via occupationId): ${noteIdsForOcc.length}`);
  console.log(`  LigneOccupation: ${ligneIds.length}`);
  console.log(`  Note (pieces jointes tiers): ${noteIdsAttachments.length}`);

  const occColsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='Occupation' ORDER BY ordinal_position`, [DEV]);
  const occCols = occColsRes.rows.map(r => r.column_name);
  const noteColsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='Note' ORDER BY ordinal_position`, [DEV]);
  const noteCols = noteColsRes.rows.map(r => r.column_name);
  const ligneColsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='LigneOccupation' ORDER BY ordinal_position`, [DEV]);
  const ligneCols = ligneColsRes.rows.map(r => r.column_name);

  // Backup
  const backup = {};
  if (occIds.length) backup.Occupation = (await client.query(`SELECT * FROM "${DEV}"."Occupation" WHERE id = ANY($1::int[])`, [occIds])).rows;
  if (noteIdsForOcc.length) backup.NoteViaOccupation = (await client.query(`SELECT * FROM "${DEV}"."Note" WHERE id = ANY($1::int[])`, [noteIdsForOcc])).rows;
  if (ligneIds.length) backup.LigneOccupation = (await client.query(`SELECT * FROM "${DEV}"."LigneOccupation" WHERE id = ANY($1::int[])`, [ligneIds])).rows;
  if (noteIdsAttachments.length) backup.NoteAttachments = (await client.query(`SELECT * FROM "${DEV}"."Note" WHERE id = ANY($1::int[])`, [noteIdsAttachments])).rows;
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupFile = path.join(process.cwd(), 'tmp', `migrate-wave2-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`[WAVE2] Sauvegarde ecrite : ${backupFile}`);

  if (!APPLY) { console.log('\n[WAVE2] DRY-RUN : aucune ecriture. Relancer avec --apply.'); await client.end(); return; }

  await client.query('BEGIN');
  try {
    // A) Occupations, tiersId remappe par ligne
    let occInserted = 0;
    for (const occId of occIds) {
      const row = (await client.query(`SELECT * FROM "${DEV}"."Occupation" WHERE id=$1`, [occId])).rows[0];
      if (!row) continue;
      row.tiersId = tiersIdMap[occId] || row.tiersId;
      const cols = occCols.map(c => `"${c}"`).join(', ');
      const placeholders = occCols.map((_, i) => `$${i + 1}`).join(', ');
      const values = occCols.map(c => row[c]);
      await client.query(`INSERT INTO "${PROD}"."Occupation" (${cols}) VALUES (${placeholders})`, values);
      occInserted++;
    }
    console.log(`[WAVE2] Occupation: ${occInserted} inseree(s)`);

    // Notes rattachees par occupationId (occupationId deja valide, tiersId le cas echeant remappe via tiersIdMap sur l'occupation parente)
    let noteOccInserted = 0;
    for (const noteId of noteIdsForOcc) {
      const row = (await client.query(`SELECT * FROM "${DEV}"."Note" WHERE id=$1`, [noteId])).rows[0];
      if (!row) continue;
      if (row.tiersId != null && devTiersToProd[row.tiersId]) row.tiersId = devTiersToProd[row.tiersId];
      const cols = noteCols.map(c => `"${c}"`).join(', ');
      const placeholders = noteCols.map((_, i) => `$${i + 1}`).join(', ');
      const values = noteCols.map(c => row[c]);
      await client.query(`INSERT INTO "${PROD}"."Note" (${cols}) VALUES (${placeholders})`, values);
      noteOccInserted++;
    }
    console.log(`[WAVE2] Note (via occupationId): ${noteOccInserted} inseree(s)`);

    // LigneOccupation : copie directe
    if (ligneIds.length) {
      const cols = ligneCols.map(c => `"${c}"`).join(', ');
      const res = await client.query(`INSERT INTO "${PROD}"."LigneOccupation" (${cols}) SELECT ${cols} FROM "${DEV}"."LigneOccupation" WHERE id = ANY($1::int[])`, [ligneIds]);
      console.log(`[WAVE2] LigneOccupation: ${res.rowCount} inseree(s)`);
    }

    // B) Notes/pieces jointes tiers, tiersId remappe vers le tiers PROD
    let noteAttInserted = 0;
    for (const noteId of noteIdsAttachments) {
      const row = (await client.query(`SELECT * FROM "${DEV}"."Note" WHERE id=$1`, [noteId])).rows[0];
      if (!row) continue;
      row.tiersId = notesToAddMap[noteId] || row.tiersId;
      const cols = noteCols.map(c => `"${c}"`).join(', ');
      const placeholders = noteCols.map((_, i) => `$${i + 1}`).join(', ');
      const values = noteCols.map(c => row[c]);
      await client.query(`INSERT INTO "${PROD}"."Note" (${cols}) VALUES (${placeholders})`, values);
      noteAttInserted++;
    }
    console.log(`[WAVE2] Note (pieces jointes tiers): ${noteAttInserted} inseree(s)`);

    await client.query('COMMIT');
    console.log('\n[WAVE2] OK.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[WAVE2] ECHEC, rollback effectue :', err.message);
    throw err;
  }

  await client.end();
}

main().catch((e) => { console.error('[WAVE2] Erreur fatale :', e.message); process.exit(1); });
