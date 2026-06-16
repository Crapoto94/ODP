import { join } from 'path';
import { FilienMovement, FilienParams, generateFilienFile } from '../filien';

function cleanFilename(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

function removeYearSuffix(name: string): string {
  return name.replace(/_\d{4}$/, '').replace(/-\d{4}$/, '');
}

export interface MultiYearMergedDocs {
  deliberation?: string; // absolute path to merged delib PDF
  tarifs?: string;       // absolute path to merged tarifs PDF
  aot?: string;          // absolute path to merged AOT PDF
  details?: string;      // absolute path to merged details PDF
}

export function computeNextFilienMouvement(rawStart: string, count: number): string {
  const match = rawStart.match(/^(.*?)(\d+)$/);
  if (!match) return rawStart;
  const prefix = match[1];
  const numStr = match[2];
  const nextNum = (parseInt(numStr) || 1) + count;
  return prefix + nextNum.toString().padStart(numStr.length, '0');
}

export interface BillingResult {
  id: number;
  numero: string;
  path: string;
  tiers: string;
  tiersCode?: string;
  total: number;
  lignes: any[];
}

// Internal type — _representativeId allows getFullFilienContent to find the right typeConfig
type FilienMovementWithMeta = FilienMovement & { _representativeId: number };

export function getFullFilienContent(
  results: BillingResult[],
  dossiers: any[],
  appSettings: any,
  typeConfigMap: Record<string, any>,
  tlpeConfig: any,
  odpConfigs: Record<number, any>,
  year: number,
  runName: string,
  options?: { groupMultiYear?: boolean; mergedDocs?: Record<number, MultiYearMergedDocs> }
): { content: string; movementCount: number } {
  const filienParams: FilienParams = {
    orga: appSettings?.filienOrga || '01',
    budget: appSettings?.filienBudget || 'BA',
    exercice: appSettings?.filienExercice || year,
    avancement: appSettings?.filienAvancement || '5',
    rejetDispo: appSettings?.filienRejetDispo ?? true,
    rejetCA: appSettings?.filienRejetCA ?? false,
    rejetMarche: appSettings?.filienRejetMarche ?? false,
    filienChapitre: appSettings?.filienChapitre || '',
    filienNature: appSettings?.filienNature || '',
    filienFonction: appSettings?.filienFonction || '',
    filienCodeInterne: appSettings?.filienCodeInterne || '',
    filienTypeMouvement: appSettings?.filienTypeMouvement || '',
    filienSens: appSettings?.filienSens || '',
    filienStructure: appSettings?.filienStructure || '',
    filienGestionnaire: appSettings?.filienGestionnaire || '',
  };

  const movements = prepareFilienMovements(results, dossiers, appSettings, tlpeConfig, odpConfigs, year, runName, options);

  movements.forEach((mov) => {
    const repId = (mov as FilienMovementWithMeta)._representativeId;
    const result = results.find(r => r.id === repId);
    if (!result?.id) return;
    const occ = dossiers.find(d => d.id === result.id);
    const tc = typeConfigMap[occ?.type] || {};

    if (tc.filienObjet) mov.objet = tc.filienObjet;
    if (tc.filienPreBordereau) mov.preBordereau = tc.filienPreBordereau;

    if (tc.filienChapitre) mov.lines.forEach((l: any) => l.chapitre = tc.filienChapitre);
    if (tc.filienNature) mov.lines.forEach((l: any) => l.nature = tc.filienNature);
    if (tc.filienFonction) mov.lines.forEach((l: any) => l.fonction = tc.filienFonction);
    if (tc.filienCodeInterne) mov.lines.forEach((l: any) => l.codeInterne = tc.filienCodeInterne);
    if (tc.filienTypeMouvement) mov.lines.forEach((l: any) => l.typeMouvement = tc.filienTypeMouvement);
    if (tc.filienSens) mov.lines.forEach((l: any) => l.sens = tc.filienSens);
    if (tc.filienStructure) mov.lines.forEach((l: any) => l.structure = tc.filienStructure);
    if (tc.filienGestionnaire) mov.lines.forEach((l: any) => l.gestionnaire = tc.filienGestionnaire);
  });

  return { content: generateFilienFile(filienParams, movements), movementCount: movements.length };
}

export function prepareFilienMovements(
  results: BillingResult[],
  dossiers: any[],
  appSettings: any,
  tlpeConfig: any,
  odpConfigs: Record<number, any>,
  year: number,
  runName: string,
  options?: { groupMultiYear?: boolean; mergedDocs?: Record<number, MultiYearMergedDocs> }
): FilienMovementWithMeta[] {
  const uncBase = appSettings?.filienUncPj || '';
  const runUncPath = uncBase ? join(uncBase, runName) : '';

  const rawStart = appSettings?.filienMouvement || '1';
  const match = rawStart.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : '';
  const numStr = match ? match[2] : rawStart;
  const startNum = parseInt(numStr) || 1;
  const padding = numStr.length;

  const startBordereauRaw = appSettings?.filienBordereau || '1';
  const startBordereau = parseInt(startBordereauRaw.replace(/\D/g, '')) || 1;

  const filteredResults = results.filter((r: any) => r?.id);

  // Build a single-year movement (existing logic, extracted)
  function buildSingleMovement(r: BillingResult, movIdx: number, borderIdx: number): FilienMovementWithMeta {
    const occ = dossiers.find((d: any) => d.id === r.id);
    const isOdp = occ?.type === 'CHANTIER' || occ?.type === 'TOURNAGE' || occ?.type === 'COMMERCE';
    const movYear = occ?.dateDebut ? new Date(occ.dateDebut).getFullYear() : (occ?.anneeTaxation || year);
    const regConfig = isOdp ? (odpConfigs[movYear] || odpConfigs[year]) : tlpeConfig;
    const attachments: any[] = [];

    if (regConfig?.deliberationPath) {
      const ext = regConfig.deliberationPath.split('.').pop();
      const delibName = cleanFilename(`Deliberation_${movYear}.${ext}`);
      attachments.push({ name: 'Délibération', filename: delibName, supportType: '01', path: runUncPath ? join(runUncPath, delibName) : regConfig.deliberationPath });
    } else {
      console.warn(`[Filien] Missing Delib for ${occ?.id} (Year ${movYear})`);
    }

    const tarifsPath = isOdp
      ? (occ?.type === 'TOURNAGE' ? regConfig?.tarifsTournagesPath : regConfig?.tarifsOdpPath)
      : regConfig?.tarifsPath;

    if (tarifsPath) {
      const ext = tarifsPath.split('.').pop();
      const tarifsName = cleanFilename(isOdp
        ? (occ?.type === 'TOURNAGE' ? `Tarifs_Tournages_${movYear}.${ext}` : `Tarifs_ODP_${movYear}.${ext}`)
        : `Tarifs_${movYear}.${ext}`);
      attachments.push({ name: 'Tarifs', filename: tarifsName, supportType: '01', path: runUncPath ? join(runUncPath, tarifsName) : tarifsPath });
    } else {
      console.warn(`[Filien] Missing Tarifs for ${occ?.id} (Year ${movYear})`);
    }

    const aotOcc = occ?.aotFinalPath
      ? occ
      : dossiers.find((d: any) => d.tiersId && d.tiersId === occ?.tiersId && d.anneeTaxation === occ?.anneeTaxation && d.aotFinalPath) || null;

    if (aotOcc?.aotFinalPath) {
      const ext = aotOcc.aotFinalPath.split('.').pop();
      const baseName = aotOcc?.nom ? removeYearSuffix(aotOcc.nom) : `Dossier_${aotOcc?.id}`;
      const aotName = cleanFilename(`AOT_${baseName}_${movYear}.${ext}`);
      attachments.push({ name: 'AOT', filename: aotName, supportType: '01', path: runUncPath ? join(runUncPath, aotName) : aotOcc.aotFinalPath });
    }

    attachments.push({ name: 'Détails de facture', filename: `${r.numero}.pdf`, supportType: '01', path: runUncPath ? join(runUncPath, `${r.numero}.pdf`) : r.path });

    const art0 = r.lignes?.[0]?.article || {};
    const lines = [{
      numero: 1,
      imputation: art0?.numero || 'IMPUT_VIDE',
      dateDebut: r.lignes?.[0]?.dateDebut || undefined,
      dateFin: r.lignes?.[0]?.dateFin || undefined,
      description: `Occupation du domaine public - ${occ?.nom || r.numero}`,
      quantite: 1,
      montant: r.total,
      prixUnitaire: r.total,
      chapitre: art0?.chapitre || '',
      nature: art0?.nature || '',
      fonction: art0?.fonction || '',
      codeInterne: art0?.codeInterne || '',
      typeMouvement: art0?.typeMouvement || '',
      sens: art0?.sens || '',
      structure: art0?.structure || '',
      gestionnaire: art0?.gestionnaire || '',
    }];

    return {
      _representativeId: r.id,
      id: prefix + movIdx.toString().padStart(padding, '0'),
      type: appSettings?.filienType || 'R',
      businessType: occ?.type,
      year: movYear,
      tiersCode: r.tiersCode || (occ?.debiteur || occ?.tiers)?.code_sedit || 'TIERS_INCONNU',
      libelle: `Chantier ${appSettings?.filienLibelle || occ?.nom || `Dossier #${occ?.id}`}`,
      calendrier: appSettings?.filienCalendrier || '01',
      monnaie: appSettings?.filienMonnaie || 'E',
      existant: appSettings?.filienMouvementEx || 'N',
      preBordereau: appSettings?.filienPreBordereau || '800',
      poste: appSettings?.filienPoste || '0001',
      bordereau: (startBordereau + borderIdx).toString().padStart(5, '0'),
      objet: appSettings?.filienObjet || '',
      attachments,
      lines,
    } as FilienMovementWithMeta;
  }

  if (!options?.groupMultiYear) {
    // Original behavior: one movement per result
    return filteredResults.map((r, idx) => buildSingleMovement(r, startNum + idx, idx));
  }

  // ── Grouped mode: one movement per tiersId, multiple lines for multi-year ──

  // Group results by tiersId (COMMERCE only)
  const tiersResultsMap = new Map<number, BillingResult[]>();
  filteredResults.forEach(r => {
    const occ = dossiers.find((d: any) => d.id === r.id);
    if (occ?.type === 'COMMERCE' && occ?.tiersId) {
      const tid: number = occ.tiersId;
      if (!tiersResultsMap.has(tid)) tiersResultsMap.set(tid, []);
      tiersResultsMap.get(tid)!.push(r);
    }
  });

  const outputMovements: FilienMovementWithMeta[] = [];
  const processedTiersIds = new Set<number>();
  let movIdx = startNum;
  let borderIdx = 0;

  for (const r of filteredResults) {
    const occ = dossiers.find((d: any) => d.id === r.id);
    const tiersId: number | undefined = occ?.tiersId;

    if (occ?.type === 'COMMERCE' && tiersId) {
      if (processedTiersIds.has(tiersId)) continue; // already emitted
      processedTiersIds.add(tiersId);

      const group = tiersResultsMap.get(tiersId) || [r];

      if (group.length < 2) {
        // Single year — normal movement
        outputMovements.push(buildSingleMovement(r, movIdx, borderIdx));
      } else {
        // Multi-year — grouped movement
        const sortedGroup = [...group].sort((a, b) => {
          const ya = dossiers.find((d: any) => d.id === a.id)?.anneeTaxation || 0;
          const yb = dossiers.find((d: any) => d.id === b.id)?.anneeTaxation || 0;
          return ya - yb;
        });

        const firstOcc = dossiers.find((d: any) => d.id === sortedGroup[0].id);
        const earliestYear: number = firstOcc?.anneeTaxation || year;

        // One line per year, sorted ascending
        const lines = sortedGroup.map((r2, li) => {
          const occ2 = dossiers.find((d: any) => d.id === r2.id);
          const lineYear: number = occ2?.anneeTaxation || year;
          const art0 = r2.lignes?.[0]?.article || {};
          return {
            numero: li + 1,
            year: lineYear,
            imputation: art0?.numero || 'IMPUT_VIDE',
            dateDebut: new Date(lineYear, 0, 1),
            dateFin: new Date(lineYear, 11, 31),
            label: `Droits de voirie Commerce ${lineYear}`,
            quantite: 1,
            montant: r2.total,
            prixUnitaire: r2.total,
            chapitre: art0?.chapitre || '',
            nature: art0?.nature || '',
            fonction: art0?.fonction || '',
            codeInterne: art0?.codeInterne || '',
            typeMouvement: art0?.typeMouvement || '',
            sens: art0?.sens || '',
            structure: art0?.structure || '',
            gestionnaire: art0?.gestionnaire || '',
          };
        });

        // Merged attachments
        const mergedDocInfo = options?.mergedDocs?.[tiersId];
        const attachments: any[] = [];

        if (mergedDocInfo?.deliberation) {
          const fname = `Liste_delibs_${tiersId}.pdf`;
          attachments.push({ name: 'Délibérations', filename: 'Liste_des_deliberations.pdf', supportType: '01', path: runUncPath ? join(runUncPath, fname) : `/Factures/${runName}/${fname}` });
        }
        if (mergedDocInfo?.tarifs) {
          const fname = `Liste_tarifs_${tiersId}.pdf`;
          attachments.push({ name: 'Tarifs', filename: 'Liste_des_tarifs.pdf', supportType: '01', path: runUncPath ? join(runUncPath, fname) : `/Factures/${runName}/${fname}` });
        }
        if (mergedDocInfo?.aot) {
          const fname = `Liste_AOT_${tiersId}.pdf`;
          attachments.push({ name: 'AOT', filename: 'Liste_des_AOT.pdf', supportType: '01', path: runUncPath ? join(runUncPath, fname) : `/Factures/${runName}/${fname}` });
        }
        if (mergedDocInfo?.details) {
          const fname = `Liste_details_${tiersId}.pdf`;
          attachments.push({ name: 'Détails de facture', filename: 'Liste_des_details_de_facture.pdf', supportType: '01', path: runUncPath ? join(runUncPath, fname) : `/Factures/${runName}/${fname}` });
        }

        outputMovements.push({
          _representativeId: sortedGroup[0].id,
          id: prefix + movIdx.toString().padStart(padding, '0'),
          type: appSettings?.filienType || 'R',
          businessType: 'COMMERCE',
          year: earliestYear,
          tiersCode: firstOcc?.tiers?.code_sedit || 'TIERS_INCONNU',
          libelle: firstOcc?.tiers?.nom || 'Commerce',
          calendrier: appSettings?.filienCalendrier || '01',
          monnaie: appSettings?.filienMonnaie || 'E',
          existant: appSettings?.filienMouvementEx || 'N',
          preBordereau: appSettings?.filienPreBordereau || '800',
          poste: appSettings?.filienPoste || '0001',
          bordereau: (startBordereau + borderIdx).toString().padStart(5, '0'),
          objet: appSettings?.filienObjet || '',
          attachments,
          lines,
        } as FilienMovementWithMeta);
      }
    } else {
      // Non-COMMERCE: normal movement
      outputMovements.push(buildSingleMovement(r, movIdx, borderIdx));
    }

    movIdx++;
    borderIdx++;
  }

  return outputMovements;
}
