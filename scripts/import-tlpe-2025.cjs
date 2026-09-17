/*
 * Import des factures TLPE 2025 (ancien logiciel) dans l'application.
 *
 * Source : dossier 2025/ (24 exports Filien "TLPE 2025", chacun regroupant
 * plusieurs factures individuelles separees par des blocs /01/.../##/, +
 * 85 PDF de factures). Voir tmp/scratch/import_plan_2025_v2.json pour le
 * detail complet du plan (calcule par build_import_plan_v2.cjs).
 *
 * Regles de mapping (validees avec l'utilisateur) :
 *   - Grille tarifaire 2025 (Article, categorieId=30, refSlot) :
 *       744 = Enseignes 12-50m2      (66,00 EUR/m2)
 *       745 = Enseignes >50m2        (107,10 EUR/m2)
 *       746 = Dispositifs non-num <=50m2 (37,00 EUR/m2)
 *       747 = Dispositifs non-num >50m2  (66,00 EUR/m2)
 *       748 = Dispositifs num <=50m2  (86,60 EUR/m2)
 *       749 = Dispositifs num >50m2   (148,20 EUR/m2)
 *     Le tarif de chaque ligne (deja fixe par l'ancien logiciel) determine
 *     directement la categorie ; a tarif egal (66,00), le libelle
 *     (enseigne vs panneau/dispositif/publicite) tranche entre 744 et 747.
 *   - EXCLU de l'import (sur decision explicite) :
 *       - lignes "Reliquat TLPE <annee anterieure>" (solde d'une annee
 *         precedente, pas un dossier 2025)
 *       - lignes "Enseigne temporaire palissade/portail ... chantier"
 *         (panneaux de chantier temporaires, hors perimetre TLPE ici)
 *     Un tiers dont TOUTES les lignes sont exclues n'a aucun dossier cree.
 *   - 2 tiers absents de la base (GTL085 "AS (TOOLOUER)", GTL143 "IVRY 4E
 *     (NEXITY)") sont crees avant l'import des dossiers.
 *   - 1 dossier PDF par tiers est rattache en piece jointe (Note) quand un
 *     PDF correspondant a ete trouve dans 2025/ (tmp/scratch/pdf_by_code.json).
 *
 * Chaque LigneOccupation.montant = le TARIF UNITAIRE (comme le fait l'appli
 * elle-meme pour TLPE, cf lib/tlpe-utils.ts) ; quantite1 = la surface/quantite
 * de la ligne. Occupation.montantCalcule est fixe directement a la somme
 * reelle facturee (dossiers historiques et deja factures, statut FACTURE),
 * sans dependre du recalcul au prorata de l'appli.
 *
 * Usage :
 *   node scripts/import-tlpe-2025.cjs --schema=ODP_DEV [--apply]
 *   node scripts/import-tlpe-2025.cjs --schema=ODP [--apply]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const schemaArg = args.find((a) => a.startsWith('--schema='));
const SCHEMA = schemaArg ? schemaArg.split('=')[1] : 'ODP_DEV';

const NEW_TIERS = {
  GTL085: { nom: 'AS (TOOLOUER)', adresse: null },
  GTL143: { nom: 'IVRY 4E (NEXITY)', adresse: '1 Rue Maurice Gunsbourg' },
};

function parseDate(ddmmyyyy) {
  // format "01012025" -> 2025-01-01
  const d = ddmmyyyy.slice(0, 2), m = ddmmyyyy.slice(2, 4), y = ddmmyyyy.slice(4);
  return `${y}-${m}-${d}`;
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'settings.json'), 'utf8')).postgres;
  const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'scratch', 'import_plan_2025_v2.json'), 'utf8'));
  const pdfByCode = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'scratch', 'pdf_by_code.json'), 'utf8'));
  const uploadMapPath = path.join(process.cwd(), 'tmp', 'scratch', 'tlpe_2025_upload_map.json');
  const uploadMap = fs.existsSync(uploadMapPath) ? JSON.parse(fs.readFileSync(uploadMapPath, 'utf8')) : {};

  const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database });
  await client.connect();
  console.log(`[TLPE-2025] schema=${SCHEMA} apply=${APPLY}`);

  const toImport = plan.filter((p) => p.kept.length > 0);
  const skipped = plan.filter((p) => p.kept.length === 0);
  console.log(`  Tiers avec dossier a creer: ${toImport.length}`);
  console.log(`  Tiers sans ligne retenue (rien a importer): ${skipped.length} (${skipped.map((s) => s.codeSedit).join(', ')})`);
  console.log(`  Tiers a creer: ${Object.keys(NEW_TIERS).join(', ')}`);

  const totalMontant = toImport.reduce((s, p) => s + parseFloat(p.montantKept), 0);
  console.log(`  Montant total a importer: ${totalMontant.toFixed(2)} EUR`);

  if (!APPLY) {
    console.log('\n[TLPE-2025] DRY-RUN : aucune ecriture. Relancer avec --apply.');
    await client.end();
    return;
  }

  const report = { schema: SCHEMA, tiersCreated: [], occupationsCreated: [], notesCreated: [] };

  await client.query('BEGIN');
  try {
    // 1) Tiers manquants
    const tiersIdByCode = {};
    for (const p of plan) if (p.tiersId) tiersIdByCode[p.codeSedit] = p.tiersId;

    for (const [code, info] of Object.entries(NEW_TIERS)) {
      const existing = await client.query(`SELECT id FROM "${SCHEMA}"."Tiers" WHERE code_sedit=$1`, [code]);
      if (existing.rows.length) {
        tiersIdByCode[code] = existing.rows[0].id;
        console.log(`[TLPE-2025] Tiers ${code} deja present (#${existing.rows[0].id})`);
        continue;
      }
      const ins = await client.query(
        `INSERT INTO "${SCHEMA}"."Tiers" (nom, code_sedit, adresse, statut, created_at, updated_at)
         VALUES ($1, $2, $3, 'PROVISOIRE', now(), now()) RETURNING id`,
        [info.nom, code, info.adresse]
      );
      tiersIdByCode[code] = ins.rows[0].id;
      report.tiersCreated.push({ code, id: ins.rows[0].id, nom: info.nom });
      console.log(`[TLPE-2025] Tiers ${code} "${info.nom}" cree (#${ins.rows[0].id})`);
    }

    // 2) Dossiers TLPE 2025 + lignes
    for (const p of toImport) {
      const tiersId = tiersIdByCode[p.codeSedit];
      if (!tiersId) { console.warn(`[TLPE-2025] ${p.codeSedit}: tiersId introuvable, ignore`); continue; }

      const tiersAdresse = await client.query(`SELECT adresse FROM "${SCHEMA}"."Tiers" WHERE id=$1`, [tiersId]);
      const adresse = tiersAdresse.rows[0]?.adresse || '';

      const occRes = await client.query(
        `INSERT INTO "${SCHEMA}"."Occupation"
           ("tiersId", type, statut, "dateDebut", "dateFin", "anneeTaxation", adresse, "montantCalcule", created_at, updated_at)
         VALUES ($1, 'TLPE', 'FACTURE', '2025-01-01', '2025-12-31', 2025, $2, $3, now(), now())
         RETURNING id`,
        [tiersId, adresse, parseFloat(p.montantKept)]
      );
      const occupationId = occRes.rows[0].id;
      report.occupationsCreated.push({ codeSedit: p.codeSedit, tiersId, occupationId, montant: p.montantKept });

      for (const l of p.kept) {
        await client.query(
          `INSERT INTO "${SCHEMA}"."LigneOccupation"
             ("occupationId", "articleId", quantite1, quantite2, "dateDebut", "dateFin", montant, note, created_at, updated_at)
           VALUES ($1, $2, $3, 1, $4, $5, $6, $7, now(), now())`,
          [
            occupationId,
            l.resolved.articleId,
            parseFloat(l.quantite.replace(',', '.')),
            parseDate(l.dateDebut),
            parseDate(l.dateFin),
            parseFloat(l.tarifUnitaire.replace(',', '.')),
            l.description,
          ]
        );
      }
      console.log(`[TLPE-2025] ${p.codeSedit}: Occupation #${occupationId} + ${p.kept.length} ligne(s), montant=${p.montantKept}EUR`);

      // 3) Piece jointe (PDF) si trouvee -- uploadee une seule fois (partagee entre DEV et PROD)
      const pdfFiles = pdfByCode[p.codeSedit];
      if (pdfFiles && pdfFiles.length) {
        const pdfFile = pdfFiles[0];
        let pjPath = uploadMap[p.codeSedit];
        if (!pjPath) {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const uuid = crypto.randomUUID();
          const dest = path.join(uploadsDir, `${uuid}.pdf`);
          fs.copyFileSync(path.join(process.cwd(), '2025', pdfFile), dest);
          pjPath = `/uploads/${uuid}.pdf`;
          uploadMap[p.codeSedit] = pjPath;
        }
        await client.query(
          `INSERT INTO "${SCHEMA}"."Note" ("tiersId", content, author, "pjPath", "pjName", origin, created_at)
           VALUES ($1, $2, $3, $4, $5, 'import', now())`,
          [tiersId, 'Facture TLPE 2025 (import historique, ancien logiciel)', 'Import TLPE 2025', pjPath, pdfFile]
        );
        report.notesCreated.push({ codeSedit: p.codeSedit, tiersId, pjPath, pjName: pdfFile });
      }
    }

    await client.query('COMMIT');
    fs.writeFileSync(uploadMapPath, JSON.stringify(uploadMap, null, 2));

    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const reportFile = path.join(process.cwd(), 'tmp', `import-tlpe-2025-${SCHEMA}-${ts}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n[TLPE-2025] OK. Rapport : ${reportFile}`);
    console.log(`[TLPE-2025] ${report.tiersCreated.length} tiers crees, ${report.occupationsCreated.length} dossiers, ${report.notesCreated.length} pieces jointes.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[TLPE-2025] ECHEC, rollback effectue :', err.message);
    throw err;
  }

  await client.end();
}

main().catch((e) => { console.error('[TLPE-2025] Erreur fatale :', e.message); process.exit(1); });
