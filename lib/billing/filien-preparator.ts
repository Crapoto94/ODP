import { join } from 'path';
import { FilienMovement, FilienParams, generateFilienFile } from '../filien';

// Helper to remove accents and replace spaces with underscores
function cleanFilename(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

// Helper to remove year suffix from dossier name (e.g., "TEST_2023" -> "TEST")
function removeYearSuffix(name: string): string {
  return name.replace(/_\d{4}$/, '').replace(/-\d{4}$/, '');
}

// Helper to read the TLPE type of an invoice line's article ("ENSEIGNE", "NUM", ...)
function getLineTlpeType(ligne: any): string | null {
  const art = ligne?.article;
  if (!art) return null;
  if (art.meta?.tlpeType) return art.meta.tlpeType;
  if (art.notes) {
    try {
      const meta = typeof art.notes === 'string' ? JSON.parse(art.notes) : art.notes;
      return meta?.tlpeType || null;
    } catch { /* notes not JSON */ }
  }
  return null;
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

export function getFullFilienContent(
  results: BillingResult[],
  dossiers: any[],
  appSettings: any,
  typeConfigMap: Record<string, any>,
  tlpeConfig: any,
  odpConfigs: Record<number, any>,
  year: number,
  runName: string
): string {
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

  const movements = prepareFilienMovements(results, dossiers, appSettings, tlpeConfig, odpConfigs, year, runName);

  movements.forEach((mov, idx) => {
    const result = results[idx];
    if (!result?.id) return; // Skip if result has no id
    const occ = dossiers.find(d => d.id === result.id);
    const tc = typeConfigMap[occ?.type] || {};
    
    if (tc.filienObjet) mov.objet = tc.filienObjet;
    if (tc.filienPreBordereau) mov.preBordereau = tc.filienPreBordereau;
    
    if (tc.filienChapitre) mov.lines.forEach((l: any) => l.chapitre = tc.filienChapitre);
    if (tc.filienNature) mov.lines.forEach((l: any) => l.nature = tc.filienNature);
    // Fonction : pour les COMMERCE, une fonction distincte selon enseignes / autres
    if (occ?.type === 'COMMERCE') {
      mov.lines.forEach((l: any) => {
        const fonction = l.category === 'ENSEIGNE'
          ? (tc.filienFonctionEnseignes || tc.filienFonction)
          : (tc.filienFonctionAutres || tc.filienFonction);
        if (fonction) l.fonction = fonction;
      });
    } else if (tc.filienFonction) {
      mov.lines.forEach((l: any) => l.fonction = tc.filienFonction);
    }
    if (tc.filienCodeInterne) mov.lines.forEach((l: any) => l.codeInterne = tc.filienCodeInterne);
    if (tc.filienTypeMouvement) mov.lines.forEach((l: any) => l.typeMouvement = tc.filienTypeMouvement);
    if (tc.filienSens) mov.lines.forEach((l: any) => l.sens = tc.filienSens);
    if (tc.filienStructure) mov.lines.forEach((l: any) => l.structure = tc.filienStructure);
    if (tc.filienGestionnaire) mov.lines.forEach((l: any) => l.gestionnaire = tc.filienGestionnaire);
  });

  return generateFilienFile(filienParams, movements);
}

export function prepareFilienMovements(
  results: BillingResult[],
  dossiers: any[],
  appSettings: any,
  tlpeConfig: any,
  odpConfigs: Record<number, any>,
  year: number,
  runName: string
): FilienMovement[] {
  const uncBase = appSettings?.filienUncPj || '';
  const runUncPath = uncBase ? join(uncBase, runName) : '';

  const rawStart = appSettings?.filienMouvement || '1';
  const match = rawStart.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : '';
  const numStr = match ? match[2] : rawStart;
  const startNum = parseInt(numStr) || 1;
  const padding = numStr.length;

  return results.filter((r: any) => r?.id).map((r, idx) => {
    const occ = dossiers.find((d: any) => d.id === r.id);
    const isOdp = occ?.type === 'CHANTIER' || occ?.type === 'TOURNAGE' || occ?.type === 'COMMERCE';
    const movYear = occ?.dateDebut ? new Date(occ.dateDebut).getFullYear() : (occ?.anneeTaxation || year);
    const regConfig = isOdp ? (odpConfigs[movYear] || odpConfigs[year]) : tlpeConfig;
    
    const attachments = [];
    const mouvementId = prefix + (startNum + idx).toString().padStart(padding, '0');

    if (regConfig?.deliberationPath) {
      const ext = regConfig.deliberationPath.split('.').pop();
      const delibName = cleanFilename(`Deliberation_${movYear}.${ext}`);
      console.log(`[Filien] Found Delib for ${occ.id} (Year ${movYear}): ${delibName}`);
      attachments.push({
        name: 'Délibération',
        filename: delibName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, delibName) : regConfig.deliberationPath,
      });
    } else {
      console.warn(`[Filien] Missing Delib for ${occ.id} (Year ${movYear})`);
    }

    const tarifsPath = isOdp
      ? (occ?.type === 'TOURNAGE' ? regConfig?.tarifsTournagesPath : regConfig?.tarifsOdpPath)
      : regConfig?.tarifsPath;

    if (tarifsPath) {
      const ext = tarifsPath.split('.').pop();
      const tarifsName = cleanFilename(isOdp
        ? (occ?.type === 'TOURNAGE' ? `Tarifs_Tournages_${movYear}.${ext}` : `Tarifs_ODP_${movYear}.${ext}`)
        : `Tarifs_${movYear}.${ext}`);
      console.log(`[Filien] Found Tarifs for ${occ.id} (Year ${movYear}): ${tarifsName}`);
      attachments.push({
        name: 'Tarifs',
        filename: tarifsName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, tarifsName) : tarifsPath,
      });
    } else {
      console.warn(`[Filien] Missing Tarifs for ${occ.id} (Year ${movYear})`);
    }

    if (occ?.aotFinalPath) {
      const ext = occ.aotFinalPath.split('.').pop();
      const baseName = occ?.nom ? removeYearSuffix(occ.nom) : `Dossier_${occ?.id}`;
      const aotName = cleanFilename(`AOT_${baseName}_${movYear}.${ext}`);
      attachments.push({
        name: 'AOT',
        filename: aotName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, aotName) : occ.aotFinalPath,
      });
    }

    attachments.push({
      name: 'Détails de facture',
      filename: `${r.numero}.pdf`,
      supportType: '01',
      path: runUncPath ? join(runUncPath, `${r.numero}.pdf`) : r.path,
    });

    const startBordereauRaw = appSettings?.filienBordereau || '1';
    const startBordereau = parseInt(startBordereauRaw.replace(/\D/g, '')) || 1;

    // Common analytical fields, taken from the 1st invoice line's article
    const art0 = r.lignes?.[0]?.article || {};
    const baseLineFields = {
      imputation: art0?.numero || 'IMPUT_VIDE',
      dateDebut: r.lignes?.[0]?.dateDebut || undefined,
      dateFin: r.lignes?.[0]?.dateFin || undefined,
      description: `Occupation du domaine public - ${occ?.nom || r.numero}`,
      quantite: 1,
      chapitre: art0?.chapitre || '',
      nature: art0?.nature || '',
      fonction: art0?.fonction || '',
      codeInterne: art0?.codeInterne || '',
      typeMouvement: art0?.typeMouvement || '',
      sens: art0?.sens || '',
      structure: art0?.structure || '',
      gestionnaire: art0?.gestionnaire || '',
    };

    let lines: any[];
    if (occ?.type === 'COMMERCE') {
      // Split the invoice total into an "enseignes" line and an "autres" line.
      const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
      const enseignesTotal = round2(
        (r.lignes || []).reduce(
          (s: number, l: any) =>
            getLineTlpeType(l) === 'ENSEIGNE' ? s + (l.calculatedTotal ?? l.montant ?? 0) : s,
          0
        )
      );
      // "autres" = remainder so the two lines always sum to the invoice total
      const autresTotal = round2(r.total - enseignesTotal);

      lines = [
        { ...baseLineFields, label: 'Total enseignes', category: 'ENSEIGNE', montant: enseignesTotal, prixUnitaire: enseignesTotal },
        { ...baseLineFields, label: 'Total autres', category: 'AUTRES', montant: autresTotal, prixUnitaire: autresTotal },
      ].filter((l) => Math.abs(l.montant) > 0.001);

      // Always keep at least one line (fallback to the full total under "autres")
      if (lines.length === 0) {
        lines = [{ ...baseLineFields, label: 'Total autres', category: 'AUTRES', montant: r.total, prixUnitaire: r.total }];
      }
      lines.forEach((l: any, i: number) => { l.numero = i + 1; });
    } else {
      lines = [{ ...baseLineFields, numero: 1, montant: r.total, prixUnitaire: r.total }];
    }

    return {
      id: mouvementId,
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
      bordereau: (startBordereau + idx).toString().padStart(5, '0'),
      objet: appSettings?.filienObjet || '',
      attachments,
      lines,
    };
  });
}
