import { join } from 'path';
import { writeFile } from 'fs/promises';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getFullFilienContent, exportToUnc } from '@/lib/billing-service';
import { ProcessedInvoice } from './invoice-processor';
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

  // Validate results
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
}): Promise<string> {
  const { results, dossiers, appSettings, odpConfigMap, year, runName, timestampStr, facturesDir, recapFilename, recapPath } = params;
  
  const typeConfigs = await prisma.typeDossierConfig.findMany();
  const typeConfigMap: Record<string, any> = {};
  typeConfigs.forEach((tc: any) => { if (tc.type) typeConfigMap[tc.type] = tc; });

  const filienContent = getFullFilienContent(
    results,
    dossiers,
    appSettings,
    typeConfigMap,
    null,
    odpConfigMap,
    year,
    runName
  );

  const filienFilename = `FACT-${timestampStr}.filien.txt`;
  const filienPath = join(facturesDir, filienFilename);
  await writeFile(filienPath, Buffer.from(filienContent, 'latin1'));

  // Always export regulatory documents and AOT files to the factures directory
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
    dossiers
  });

  return filienPath;
}
