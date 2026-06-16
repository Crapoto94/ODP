import { join } from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getFullFilienContent, exportToUnc, MultiYearMergedDocs } from '@/lib/billing-service';
import { ProcessedInvoice } from './invoice-processor';
import { computeNextFilienMouvement } from './filien-preparator';
import { mergePdfFiles } from './pdf-merger';
import { prisma } from '@/lib/prisma';

export async function generateRecapPdf(params: {
  results: ProcessedInvoice[];
  type: string;
  grandTotal: number;
  now: Date;
  facturesDir: string;
  timestampStr: string;
}): Promise<{ filename: string; path: string }> {
  const { results, type, grandTotal, now, facturesDir, timestampStr } = params;

  const validResults = results.filter((r) => {
    if (!r || !r.numero || !r.tiers || typeof r.total !== 'number' || !Array.isArray(r.lignes)) {
      console.warn('[RECAP PDF] Skipping invalid result:', { id: r?.id, numero: r?.numero, tiers: r?.tiers });
      return false;
    }
    return true;
  });

  if (validResults.length === 0) {
    throw new Error('No valid results to generate recap PDF');
  }

  const recapDoc = new jsPDF();
  recapDoc.setFontSize(18);
  recapDoc.text(`Recapitulatif de Facturation - ${type}`, 20, 20);
  recapDoc.setFontSize(10);
  recapDoc.text(`Date: ${format(now, 'dd/MM/yyyy HH:mm')}`, 20, 30);
  recapDoc.text(`Nombre de dossiers: ${validResults.length}`, 20, 35);
  recapDoc.text(`Montant Total: ${grandTotal.toFixed(2)} €`, 20, 40);

  let y = 55;
  recapDoc.line(20, y - 5, 190, y - 5);
  validResults.forEach((r) => {
    if (y > 270) { recapDoc.addPage(); y = 20; }
    recapDoc.setFont('helvetica', 'bold');
    recapDoc.text(`${r.numero} - ${r.tiers}${r.annee ? ` (${r.annee})` : ''}`, 20, y);
    recapDoc.setFont('helvetica', 'normal');
    recapDoc.text(`${r.total.toFixed(2)} €`, 170, y, { align: 'right' });
    y += 5;
    r.lignes.forEach((l: any) => {
      if (l?.article?.designation) {
        recapDoc.text(`  - ${l.article.designation}: ${l.calculatedTotal.toFixed(2)} €`, 25, y);
        y += 5;
      }
    });
    y += 5;
  });

  const recapFilename = `FACT-${timestampStr}.pdf`;
  const recapPath = join(facturesDir, recapFilename);
  await writeFile(recapPath, Buffer.from(recapDoc.output('arraybuffer')));
  return { filename: recapFilename, path: recapPath };
}

export async function processFilienExport(params: {
  results: ProcessedInvoice[];
  dossiers: any[];
  appSettings: any;
  odpConfigMap: Record<number, any>;
  year: number;
  runName: string;
  timestampStr: string;
  facturesDir: string;
  recapFilename: string;
  recapPath: string;
  groupMultiYear?: boolean;
}): Promise<string> {
  const { results, dossiers, appSettings, odpConfigMap, year, runName, timestampStr, facturesDir, recapFilename, recapPath, groupMultiYear } = params;

  const typeConfigs = await prisma.typeDossierConfig.findMany();
  const typeConfigMap: Record<string, any> = {};
  typeConfigs.forEach((tc: any) => { if (tc.type) typeConfigMap[tc.type] = tc; });

  const publicPath = join(process.cwd(), 'public');

  // ── Build merged PDFs for multi-year COMMERCE groups ──────────────────────
  const mergedDocs: Record<number, MultiYearMergedDocs> = {};

  if (groupMultiYear) {
    // Group results by tiersId
    const tiersGroups = new Map<number, { results: ProcessedInvoice[]; annees: number[] }>();
    for (const r of results) {
      if (!r?.id) continue;
      const occ = dossiers.find((d: any) => d.id === r.id);
      if (occ?.type !== 'COMMERCE' || !occ?.tiersId) continue;
      const tid: number = occ.tiersId;
      const annee: number = occ.anneeTaxation || year;
      if (!tiersGroups.has(tid)) tiersGroups.set(tid, { results: [], annees: [] });
      tiersGroups.get(tid)!.results.push(r);
      tiersGroups.get(tid)!.annees.push(annee);
    }

    for (const [tiersId, group] of tiersGroups) {
      if (group.results.length < 2) continue; // nothing to merge

      // Sort by year
      const sorted = group.results
        .map((r, i) => ({ r, annee: group.annees[i] }))
        .sort((a, b) => a.annee - b.annee);

      const merged: MultiYearMergedDocs = {};

      console.log(`[PDF MERGE] Processing tiersId ${tiersId}, years: ${sorted.map(s => s.annee).join(', ')}`);

      // Délibérations (one per year from odpConfigMap)
      const delibPaths = sorted.map(({ annee: a }) => {
        const cfg = odpConfigMap[a];
        if (!cfg?.deliberationPath) { console.warn(`[PDF MERGE] No deliberationPath in odpConfig for year ${a}`); return null; }
        const src = cfg.deliberationPath.startsWith('/') ? join(publicPath, cfg.deliberationPath) : cfg.deliberationPath;
        if (!existsSync(src)) { console.warn(`[PDF MERGE] Delib not found: ${src}`); return null; }
        return src;
      }).filter(Boolean) as string[];
      console.log(`[PDF MERGE] Delib paths for tiersId ${tiersId}:`, delibPaths);

      const delibBuf = await mergePdfFiles(delibPaths);
      if (delibBuf) {
        const fname = `Liste_delibs_${tiersId}.pdf`;
        await writeFile(join(facturesDir, fname), delibBuf);
        merged.deliberation = join(facturesDir, fname);
        console.log(`[PDF MERGE] Delibs merged OK for tiersId ${tiersId}: ${fname}`);
      } else {
        console.warn(`[PDF MERGE] Delib merge returned null for tiersId ${tiersId} (${delibPaths.length} paths checked)`);
      }

      // Tarifs (tarifsOdpPath per year)
      const tarifsPaths = sorted.map(({ annee: a }) => {
        const cfg = odpConfigMap[a];
        const p = cfg?.tarifsOdpPath;
        if (!p) { console.warn(`[PDF MERGE] No tarifsOdpPath in odpConfig for year ${a}`); return null; }
        const src = p.startsWith('/') ? join(publicPath, p) : p;
        if (!existsSync(src)) { console.warn(`[PDF MERGE] Tarifs not found: ${src}`); return null; }
        return src;
      }).filter(Boolean) as string[];
      console.log(`[PDF MERGE] Tarifs paths for tiersId ${tiersId}:`, tarifsPaths);

      const tarifsBuf = await mergePdfFiles(tarifsPaths);
      if (tarifsBuf) {
        const fname = `Liste_tarifs_${tiersId}.pdf`;
        await writeFile(join(facturesDir, fname), tarifsBuf);
        merged.tarifs = join(facturesDir, fname);
        console.log(`[PDF MERGE] Tarifs merged OK for tiersId ${tiersId}: ${fname}`);
      } else {
        console.warn(`[PDF MERGE] Tarifs merge returned null for tiersId ${tiersId} (${tarifsPaths.length} paths checked)`);
      }

      // AOT (one per year — first occ with aotFinalPath for that tiersId + annee)
      const aotPaths = sorted.map(({ annee: a }) => {
        const aotOcc = dossiers.find((d: any) => d.tiersId === tiersId && d.anneeTaxation === a && d.aotFinalPath);
        if (!aotOcc?.aotFinalPath) { console.warn(`[PDF MERGE] No AOT for tiersId ${tiersId}, year ${a}`); return null; }
        const src = aotOcc.aotFinalPath.startsWith('/') ? join(publicPath, aotOcc.aotFinalPath) : aotOcc.aotFinalPath;
        if (!existsSync(src)) { console.warn(`[PDF MERGE] AOT not found: ${src}`); return null; }
        return src;
      }).filter(Boolean) as string[];
      console.log(`[PDF MERGE] AOT paths for tiersId ${tiersId}:`, aotPaths);

      const aotBuf = await mergePdfFiles(aotPaths);
      if (aotBuf) {
        const fname = `Liste_AOT_${tiersId}.pdf`;
        await writeFile(join(facturesDir, fname), aotBuf);
        merged.aot = join(facturesDir, fname);
        console.log(`[PDF MERGE] AOT merged OK for tiersId ${tiersId}: ${fname}`);
      } else {
        console.warn(`[PDF MERGE] AOT merge returned null for tiersId ${tiersId} (${aotPaths.length} paths checked)`);
      }

      // Détails de facture (invoice PDFs)
      const detailPaths = sorted.map(({ r }) => {
        const src = r.path?.startsWith('/') ? join(publicPath, r.path) : r.path;
        if (!src || !existsSync(src)) { console.warn(`[PDF MERGE] Invoice PDF not found: ${src}`); return null; }
        return src;
      }).filter(Boolean) as string[];
      console.log(`[PDF MERGE] Invoice detail paths for tiersId ${tiersId}:`, detailPaths);

      const detailBuf = await mergePdfFiles(detailPaths);
      if (detailBuf) {
        const fname = `Liste_details_${tiersId}.pdf`;
        await writeFile(join(facturesDir, fname), detailBuf);
        merged.details = join(facturesDir, fname);
        console.log(`[PDF MERGE] Details merged OK for tiersId ${tiersId}: ${fname}`);
      } else {
        console.warn(`[PDF MERGE] Details merge returned null for tiersId ${tiersId} (${detailPaths.length} paths checked)`);
      }

      mergedDocs[tiersId] = merged;
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const { content: filienContent, movementCount } = getFullFilienContent(
    results,
    dossiers,
    appSettings,
    typeConfigMap,
    null,
    odpConfigMap,
    year,
    runName,
    { groupMultiYear, mergedDocs }
  );

  const filienFilename = `FACT-${timestampStr}.filien.txt`;
  const filienPath = join(facturesDir, filienFilename);
  await writeFile(filienPath, Buffer.from(filienContent, 'latin1'));

  // Advance movement counter by actual number of movements emitted
  if (movementCount > 0) {
    const nextMouvement = computeNextFilienMouvement(appSettings?.filienMouvement || '1', movementCount);
    await (prisma as any).appSettings.update({ where: { id: 1 }, data: { filienMouvement: nextMouvement } });
    console.log(`[Filien] filienMouvement updated to ${nextMouvement} (${movementCount} mouvement(s))`);
  }

  const exportDir = appSettings?.filienUncPj || join(process.cwd(), 'public', 'Factures');
  await exportToUnc({
    uncDir: exportDir,
    runName,
    filienContent,
    filienFilename,
    results,
    tlpeConfig: null,
    odpConfigs: odpConfigMap,
    recapFilename,
    recapPath,
    facturesDir,
    appSettings,
    dossiers,
    mergedDocs: Object.keys(mergedDocs).length > 0 ? mergedDocs : undefined,
  });

  return filienPath;
}
