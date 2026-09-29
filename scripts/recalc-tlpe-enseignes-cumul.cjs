/*
 * Recalcul TLPE - tarif des enseignes sur la surface CUMULEE du dossier.
 *
 * Regle metier : le tarif au m² applicable aux enseignes depend de la surface
 * cumulee de TOUTES les enseignes du dossier, et non de la surface de chaque
 * enseigne prise isolement. Exemple dossier 141 : plusieurs enseignes < 50 m²
 * dont le cumul depasse 50 m² -> toutes les lignes doivent porter le tarif
 * "> 50 m²".
 *
 * Ce script re-tarife les lignes ENSEIGNE des dossiers TLPE existants
 * (lignes non supprimees) et recalcule Occupation.montantCalcule. Il ne
 * touche PAS aux dispositifs non-numeriques / numeriques (regle inchangee).
 *
 * Le rapport ne liste que les dossiers dont AU MOINS UN montant a change.
 *
 * Usage :
 *   node scripts/recalc-tlpe-enseignes-cumul.cjs                    (dry-run, schema prod)
 *   node scripts/recalc-tlpe-enseignes-cumul.cjs --apply
 *   node scripts/recalc-tlpe-enseignes-cumul.cjs --schema=ODP_DEV [--apply]
 *   node scripts/recalc-tlpe-enseignes-cumul.cjs --occupation=141    (cible un dossier)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INCLUDE_FACTURED = args.includes('--include-factured');
const schemaArg = args.find((a) => a.startsWith('--schema='));
const occArg = args.find((a) => a.startsWith('--occupation='));
const TARGET_OCCUPATION = occArg ? parseInt(occArg.split('=')[1]) : null;

const SEUIL_ENSEIGNE_M2 = 50;
const EPSILON = 0.005;

// Statuts pour lesquels le dossier est considere facture / cloture
// (cf. READ_ONLY_STATUSES dans app/dashboard/tlpe/[id]/page.tsx).
const STATUTS_FACTURES = ['FACTURÉ', 'FACTURE', 'TITRÉ', 'TITRE', 'PAYÉ', 'PAYE', 'CLOS'];

function isRefArticle(notes) {
  try {
    return JSON.parse(notes || '{}').isRef === true;
  } catch (e) {
    return false;
  }
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Identique a lib/tlpe-utils.ts calculateMonthlyProrata (mois pleins).
function calculateMonthlyProrata(startDate, endDate) {
  let fullStartDate = new Date(startDate);
  if (fullStartDate.getDate() !== 1) {
    fullStartDate = new Date(fullStartDate.getFullYear(), fullStartDate.getMonth() + 1, 1);
  }

  let fullEndDate = new Date(endDate);
  if (fullEndDate.getDate() !== getDaysInMonth(fullEndDate)) {
    fullEndDate = new Date(fullEndDate.getFullYear(), fullEndDate.getMonth(), 0);
  }

  if (fullEndDate < fullStartDate) return 0;

  const months = (fullEndDate.getFullYear() - fullStartDate.getFullYear()) * 12
    + (fullEndDate.getMonth() - fullStartDate.getMonth()) + 1;

  return months / 12;
}

// Identique a lib/tlpe-tarifs.ts getTlpeType (duplique : ce script .cjs ne
// peut pas importer le module TypeScript).
function resolveTlpeType(designation, notes) {
  let meta = {};
  try {
    meta = JSON.parse(notes || '{}');
  } catch (e) {
    meta = {};
  }

  if (meta.tlpeType) return meta.tlpeType;
  if (typeof meta.refSlot === 'string') {
    if (meta.refSlot.startsWith('enseignes_')) return 'ENSEIGNE';
    if (meta.refSlot.startsWith('pub_non_num_')) return 'NON_NUM';
    if (meta.refSlot.startsWith('pub_num_')) return 'NUM';
  }
  return (designation || '').trim().toLowerCase().startsWith('enseigne') ? 'ENSEIGNE' : '';
}

// Identique a lib/tlpe-tarifs.ts getEnseigneSlotCourant : palier enseigne
// actuellement porte par la ligne (pour ne corriger que les paliers faux).
function resolveSlotCourant(designation, notes, montant, grille) {
  let meta = {};
  try {
    meta = JSON.parse(notes || '{}');
  } catch (e) {
    meta = {};
  }

  if (meta.refSlot === 'enseignes_12_50' || meta.refSlot === 'enseignes_50_plus') return meta.refSlot;

  const m = Number(montant) || 0;
  if (grille) {
    if (Math.abs(m - (grille.enseignes_50_plus || 0)) < 0.005) return 'enseignes_50_plus';
    if (Math.abs(m - (grille.enseignes_12_50 || 0)) < 0.005) return 'enseignes_12_50';
  }

  const d = (designation || '').trim().toLowerCase();
  if (d.startsWith('enseigne')) {
    return (d.includes('>') || d.includes('plus')) ? 'enseignes_50_plus' : 'enseignes_12_50';
  }

  return null;
}

function money(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'settings.json'), 'utf8')).postgres;
  const SCHEMA = schemaArg ? schemaArg.split('=')[1] : (config.schema || 'ODP');

  const client = new Client({ host: config.host, port: config.port, user: config.user, password: config.password, database: config.database });
  await client.connect();
  console.log(`[RECALC-TLPE] schema=${SCHEMA} apply=${APPLY}${TARGET_OCCUPATION ? ` occupation=${TARGET_OCCUPATION}` : ''}`);

  // 1. Grilles tarifaires de reference (Article categorieId=30, notes.isRef)
  const refRows = (await client.query(
    `SELECT id, montant, notes FROM "${SCHEMA}"."Article" WHERE "categorieId" = 30`
  )).rows;

  const grilles = {};
  const refArticleIdByYearSlot = {};
  for (const row of refRows) {
    let meta = {};
    try { meta = JSON.parse(row.notes || '{}'); } catch (e) {}
    if (meta.isRef !== true || !meta.annee || !meta.refSlot) continue;
    if (!grilles[meta.annee]) grilles[meta.annee] = {};
    grilles[meta.annee][meta.refSlot] = Number(row.montant) || 0;
    if (!refArticleIdByYearSlot[meta.annee]) refArticleIdByYearSlot[meta.annee] = {};
    refArticleIdByYearSlot[meta.annee][meta.refSlot] = row.id;
  }

  const hasGrilleEnseigne = (annee) => {
    const g = grilles[annee];
    return !!(g && (g.enseignes_12_50 !== undefined || g.enseignes_50_plus !== undefined));
  };

  // 2. Seuils d'exoneration par annee (TlpeConfig)
  const seuils = {};
  for (const row of (await client.query(`SELECT annee, exoneration FROM "${SCHEMA}"."TlpeConfig"`)).rows) {
    seuils[row.annee] = Number(row.exoneration);
  }

  // 3. Dossiers TLPE
  const occWhere = TARGET_OCCUPATION ? `AND o.id = ${TARGET_OCCUPATION}` : '';
  const occupations = (await client.query(
    `SELECT o.id, o."tiersId", o.statut, o."anneeTaxation", o."dateDebut", o."montantCalcule", o."isArchived",
            t.nom AS tiers_nom, t.code_sedit
     FROM "${SCHEMA}"."Occupation" o
     LEFT JOIN "${SCHEMA}"."Tiers" t ON t.id = o."tiersId"
     WHERE o.type = 'TLPE' ${occWhere}
     ORDER BY o.id`
  )).rows;

  if (occupations.length === 0) {
    console.log('[RECALC-TLPE] Aucun dossier TLPE trouve.');
    await client.end();
    return;
  }

  const occIds = occupations.map((o) => o.id);
  const lignes = (await client.query(
    `SELECT l.id, l."occupationId", l."articleId", l.quantite1, l.montant, l."dateDebut", l."dateFin", a.notes, a.designation
     FROM "${SCHEMA}"."LigneOccupation" l
     JOIN "${SCHEMA}"."Article" a ON a.id = l."articleId"
     WHERE l."occupationId" = ANY($1) AND l."deletedAt" IS NULL
     ORDER BY l."occupationId", l.id`,
    [occIds]
  )).rows;

  const lignesByOcc = new Map();
  for (const l of lignes) {
    if (!lignesByOcc.has(l.occupationId)) lignesByOcc.set(l.occupationId, []);
    lignesByOcc.get(l.occupationId).push(l);
  }

  const report = { schema: SCHEMA, applied: APPLY, generatedAt: new Date().toISOString(), dossiers: [], skipped: [] };
  let totalLignesChangees = 0;

  for (const occ of occupations) {
    const occLignes = lignesByOcc.get(occ.id) || [];
    const annee = occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : null);
    const enseigneLignes = occLignes.filter((l) => resolveTlpeType(l.designation, l.notes) === 'ENSEIGNE');

    if (enseigneLignes.length === 0) continue;

    // Par defaut on ne touche pas aux dossiers deja factures / clotures ni
    // archives (montants deja appeles). --include-factured pour forcer.
    if (!INCLUDE_FACTURED && (STATUTS_FACTURES.includes(occ.statut) || occ.isArchived)) {
      let dejaCorrect = null;
      if (annee && hasGrilleEnseigne(annee)) {
        const cumulSkip = enseigneLignes.reduce((s, x) => s + (Number(x.quantite1) || 0), 0);
        const slotSkip = cumulSkip <= SEUIL_ENSEIGNE_M2 ? 'enseignes_12_50' : 'enseignes_50_plus';
        dejaCorrect = enseigneLignes.every((l) => resolveSlotCourant(l.designation, l.notes, l.montant, grilles[annee]) === slotSkip);
      }
      report.skipped.push({
        occupationId: occ.id,
        annee,
        statut: occ.statut,
        isArchived: occ.isArchived,
        dejaCorrect,
        raison: occ.isArchived ? 'Dossier archive - ignore par defaut' : 'Dossier deja facture - ignore par defaut',
      });
      continue;
    }

    if (!annee || !hasGrilleEnseigne(annee)) {
      report.skipped.push({ occupationId: occ.id, annee, raison: 'Grille tarifaire enseignes introuvable pour cette annee' });
      continue;
    }

    const cumul = enseigneLignes.reduce((s, l) => s + (Number(l.quantite1) || 0), 0);
    const grille = grilles[annee];
    const slotAttendu = cumul <= SEUIL_ENSEIGNE_M2 ? 'enseignes_12_50' : 'enseignes_50_plus';
    const tarifAttendu = grille[slotAttendu] || 0;
    const articleAttendu = (refArticleIdByYearSlot[annee] || {})[slotAttendu] || null;

    // On ne corrige que les lignes dont le PALIER est faux : un tarif
    // historique deja dans le bon palier n'est pas "normalise".
    const changements = enseigneLignes
      .filter((l) => resolveSlotCourant(l.designation, l.notes, l.montant, grille) !== slotAttendu)
      .map((l) => ({
        ligneId: l.id,
        articleIdAvant: l.articleId,
        designation: l.designation,
        surface: Number(l.quantite1) || 0,
        avant: Number(l.montant) || 0,
        apres: tarifAttendu,
        // Les lignes de l'import historique portent l'article de reference du
        // palier : on le reparente pour garder libelle et tarif coherents.
        nouvelArticleId: isRefArticle(l.notes) && articleAttendu ? articleAttendu : l.articleId,
      }));

    if (changements.length === 0) continue;

    // Nouveau montantCalcule du dossier (meme regle que lib/tlpe-utils.ts)
    const seuilExo = seuils[annee] !== undefined ? seuils[annee] : 12;
    const isEnseigneExempt = cumul <= seuilExo;

    const nouveauMontantCalcule = occLignes.reduce((sum, l) => {
      const type = resolveTlpeType(l.designation, l.notes);
      const montant = changements.find((c) => c.ligneId === l.id)?.apres ?? (Number(l.montant) || 0);
      if (type === 'ENSEIGNE' && isEnseigneExempt) return sum;

      const d1 = new Date(l.dateDebut || `${annee}-01-01`);
      const d2 = new Date(l.dateFin || `${annee}-12-31`);
      const prorata = calculateMonthlyProrata(d1, d2);
      return sum + (montant * (Number(l.quantite1) || 0) * prorata);
    }, 0);

    const ancienMontantCalcule = Number(occ.montantCalcule) || 0;

    report.dossiers.push({
      occupationId: occ.id,
      annee,
      tiersId: occ.tiersId,
      tiers: occ.tiers_nom,
      codeSedit: occ.code_sedit,
      statut: occ.statut,
      isArchived: occ.isArchived,
      surfaceCumuleeEnseignes: cumul,
      tarifAvant: changements[0].avant,
      tarifApres: tarifAttendu,
      lignesChangees: changements,
      montantCalculeAvant: ancienMontantCalcule,
      montantCalculeApres: nouveauMontantCalcule,
    });

    totalLignesChangees += changements.length;

    if (APPLY) {
      for (const c of changements) {
        await client.query(
          `UPDATE "${SCHEMA}"."LigneOccupation" SET montant = $1, "articleId" = $2, updated_at = now() WHERE id = $3`,
          [c.apres, c.nouvelArticleId, c.ligneId]
        );
      }
      if (Math.abs(ancienMontantCalcule - nouveauMontantCalcule) > EPSILON) {
        await client.query(`UPDATE "${SCHEMA}"."Occupation" SET "montantCalcule" = $1, updated_at = now() WHERE id = $2`, [nouveauMontantCalcule, occ.id]);
      }
    }
  }

  await client.end();

  // --- Rapport ---
  console.log('');
  console.log('='.repeat(110));
  console.log(`${APPLY ? 'APPLIQUE' : 'DRY-RUN'} : ${report.dossiers.length} dossier(s) TLPE avec montant change, ${totalLignesChangees} ligne(s) enseigne.`);
  console.log('='.repeat(110));

  for (const d of report.dossiers) {
    console.log('');
    console.log(`#${d.occupationId}  ${d.codeSedit ? d.codeSedit + ' ' : ''}${d.tiers}  [${d.annee}]  statut=${d.statut}${d.isArchived ? ' ARCHIVE' : ''}`);
    console.log(`   surface cumulee enseignes = ${d.surfaceCumuleeEnseignes} m²  =>  tarif ${money(d.tarifAvant)} -> ${money(d.tarifApres)} EUR/m²`);
    console.log(`   montant dossier ${money(d.montantCalculeAvant)} -> ${money(d.montantCalculeApres)} EUR`);
    for (const c of d.lignesChangees) {
      const reparent = c.nouvelArticleId !== c.articleIdAvant ? ` (article #${c.articleIdAvant} -> #${c.nouvelArticleId})` : '';
      console.log(`     - ligne #${c.ligneId}  ${c.designation}  ${c.surface} m² : ${money(c.avant)} -> ${money(c.apres)} EUR/m²${reparent}`);
    }
  }

  if (report.skipped.length) {
    console.log('');
    console.log(`[RECALC-TLPE] ${report.skipped.length} dossier(s) ignore(s) :`);
    for (const s of report.skipped) {
      const tag = s.dejaCorrect === false ? ' [A CORRIGER]' : s.dejaCorrect === true ? ' [deja correct]' : '';
      console.log(`   - #${s.occupationId} (annee ${s.annee}, statut ${s.statut}) : ${s.raison}${tag}`);
    }
  }

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const reportFile = path.join(outDir, `recalc-tlpe-enseignes-${SCHEMA}-${ts}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('');
  console.log(`[RECALC-TLPE] Rapport : ${reportFile}`);
  if (!APPLY) console.log('[RECALC-TLPE] DRY-RUN : aucune ecriture. Relancer avec --apply.');
}

main().catch((e) => { console.error('[RECALC-TLPE] Erreur fatale :', e.message); process.exit(1); });
