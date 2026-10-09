import { getSurfaceExoneration, getTlpeType, calculateTlpeProrata } from '../tlpe-tarifs';
import { prisma } from '@/lib/prisma';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';
import { join } from 'path';
import { writeFile } from 'fs/promises';

export interface ProcessedInvoice {
  id: number;
  numero: string;
  path: string;
  tiers: string;
  annee?: number;
  total: number;
  lignes: any[];
  pdfBuffer?: Buffer;
  occupationIds?: number[];
}

export async function processDossier(params: {
  occ: any;
  invoiceNumber: string;
  tlpeConfig: any;
  year: number;
  facturesDir: string;
  runName: string;
  agentName: string;
}): Promise<ProcessedInvoice> {
  const { occ, invoiceNumber, tlpeConfig, year, facturesDir, runName } = params;

  // 1. Generate PDF
  let pdfBuffer: Buffer;
  if (occ.isCommerceGroup) {
    const annee = occ.anneeTaxation || year;
    const occIds = occ.occupationsIncluded.map((o: any) => o.id);
    const { buffer } = await generateInvoicePdfBuffer(null, {
      invoiceNumber,
      tlpeConfig,
      occupationIds: occIds,
      annee,
      forceRed: true
    });
    pdfBuffer = buffer;
  } else {
    const { buffer } = await generateInvoicePdfBuffer(occ.id, { invoiceNumber, tlpeConfig, forceRed: true });
    pdfBuffer = buffer;
  }

  const filename = `${invoiceNumber}.pdf`;
  const fullPath = join(facturesDir, filename);
  await writeFile(fullPath, pdfBuffer);

  // 2. Calculate Totals
  const threshold = tlpeConfig?.exoneration ?? 12;
  // Surface cumulee complete des enseignes (non proratisee, articles de reference inclus) pour l'exoneration
  const totalEnseigneSurface = getSurfaceExoneration(occ.lignes) || 0;
  const isEnseigneExempt = totalEnseigneSurface <= threshold;

  const lineResults: any[] = [];
  let subtotal = (occ.lignes || []).reduce((sum: number, l: any) => {
    let mt: any = {};
    try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch (e) {}
    let lineVal = (l.montant || 0);

    if (occ.type === 'TLPE') {
      const isExempt = getTlpeType(l) === 'ENSEIGNE' && isEnseigneExempt;
      if (isExempt) {
        lineResults.push({ ...l, calculatedTotal: 0 });
        return sum;
      }
      const d1 = new Date(l.dateDebut);
      const d2 = new Date(l.dateFin);
      // Prorata en mois pleins : meme regle que la facture PDF (sinon le total du train differe du PDF remis au redevable)
      const prorata = isNaN(d1.getTime()) || isNaN(d2.getTime()) ? 1 : Math.min(1, Math.max(0, calculateTlpeProrata(d1, d2).ratio));
      const pu = (l.montant || 0);
      lineVal = (pu * (l.quantite1 || 0) * prorata);
    }

    lineResults.push({ ...l, calculatedTotal: lineVal });
    return sum + lineVal;
  }, 0) || 0;

  // Add majoration for non-authorized occupations
  let total = subtotal;
  if ((occ as any).isNotAuthorized && subtotal > 0) {
    lineResults.push({
      id: -1, // Dummy ID for majoration line
      article: {
        designation: 'Majoration - pas d\'autorisation'
      },
      montant: subtotal,
      calculatedTotal: subtotal,
      quantite1: 1,
      isMajoration: true
    });
    total = subtotal + subtotal; // Double the amount
  }
  // Note: court métrage minoration is handled as a separate line item in invoice-pdf-utils.ts

  const occupationIds = occ.isCommerceGroup
    ? occ.occupationsIncluded.map((o: any) => o.id)
    : [occ.id];

  return {
    id: occ.isCommerceGroup ? (occ.occupationsIncluded?.[0]?.id || occ.id) : occ.id,
    occupationIds,
    numero: invoiceNumber,
    path: `/Factures/${runName}/${filename}`,
    tiers: occ.tiers?.nom || 'Inconnu',
    annee: occ.anneeTaxation || year,
    total,
    lignes: lineResults,
    pdfBuffer
  };
}

/**
 * Marks dossiers as FACTURE in the database. MUST be called only after the
 * entire billing run (recap PDF, filien export, billing run record) has
 * completed successfully, otherwise dossiers would be flagged as invoiced
 * even though the process failed midway.
 */
export async function markDossiersAsFactured(params: {
  results: ProcessedInvoice[];
  dossiers: any[];
  runName: string;
  agentName: string;
  year: number;
}): Promise<void> {
  const { results, dossiers, runName, agentName, year } = params;

  const operations: Promise<any>[] = [];

  for (let i = 0; i < dossiers.length; i++) {
    const occ = dossiers[i];
    const processed = results[i];
    if (!processed) continue;

    const occupationIds = processed.occupationIds && processed.occupationIds.length > 0
      ? processed.occupationIds
      : occ.isCommerceGroup
        ? occ.occupationsIncluded.map((o: any) => o.id)
        : [occ.id];

    const filename = `${processed.numero}.pdf`;
    operations.push(
      (prisma as any).occupation.updateMany({
        where: { id: { in: occupationIds } },
        data: {
          statut: 'FACTURE',
          numeroFacture: processed.numero,
          facturePath: `/Factures/${runName}/${filename}`,
          dateFACTURE: new Date()
        }
      })
    );

    for (const occupationId of occupationIds) {
      const annee = occ.isCommerceGroup
        ? (occ.occupationsIncluded.find((o: any) => o.id === occupationId)?.anneeTaxation || year)
        : (occ.anneeTaxation || year);
      operations.push(addBillingNote(occupationId, processed.numero, annee, agentName));
    }
  }

  await Promise.all(operations);
}

async function addBillingNote(occupationId: number, invoiceNumber: string, year: number, agentName: string) {
  try {
    await (prisma as any).note.create({
      data: {
        occupationId,
        content: `💰 Facturé - Facture n° ${invoiceNumber} (${year})`,
        author: agentName,
        isEmail: false,
        origin: 'desktop',
        created_at: new Date()
      }
    });
  } catch (noteErr) {
    console.error('[NOTE CREATION ERROR]', noteErr);
  }
}
