import { prisma } from '@/lib/prisma';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { differenceInDays, isLeapYear } from 'date-fns';

export interface ProcessedInvoice {
  id: number;
  numero: string;
  path: string;
  tiers: string;
  annee?: number;
  total: number;
  lignes: any[];
  pdfBuffer?: Buffer;
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
  const { occ, invoiceNumber, tlpeConfig, year, facturesDir, runName, agentName } = params;

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
  const totalEnseigneSurface = (occ.lignes || []).reduce((sum: number, l: any) => {
    let mt: any = {};
    try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch (e) {}
    if (mt.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
    return sum;
  }, 0) || 0;
  const isEnseigneExempt = totalEnseigneSurface <= threshold;

  const lineResults: any[] = [];
  let subtotal = (occ.lignes || []).reduce((sum: number, l: any) => {
    let mt: any = {};
    try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch (e) {}
    let lineVal = (l.montant || 0);

    if (occ.type === 'TLPE') {
      const isExempt = mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt;
      if (isExempt) {
        lineResults.push({ ...l, calculatedTotal: 0 });
        return sum;
      }
      const d1 = new Date(l.dateDebut);
      const d2 = new Date(l.dateFin);
      const curYear = (occ as any).anneeTaxation || d1.getFullYear();
      const daysInYear = isLeapYear(new Date(curYear, 0, 1)) ? 366 : 365;
      const daysActive = differenceInDays(d2, d1) + 1;
      const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
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

  // 3. Update DB
  const updateData = {
    statut: 'FACTURE',
    numeroFacture: invoiceNumber,
    facturePath: `/Factures/${runName}/${filename}`
  };

  if (occ.isCommerceGroup) {
    const occIds = occ.occupationsIncluded.map((o: any) => o.id);
    await (prisma as any).occupation.updateMany({
      where: { id: { in: occIds } },
      data: updateData
    });

    for (const occupation of occ.occupationsIncluded) {
      await addBillingNote(occupation.id, invoiceNumber, occupation.anneeTaxation || year, agentName);
    }
  } else {
    await (prisma as any).occupation.update({
      where: { id: occ.id },
      data: updateData
    });
    await addBillingNote(occ.id, invoiceNumber, occ.anneeTaxation || year, agentName);
  }

  return {
    id: occ.isCommerceGroup ? (occ.occupationsIncluded?.[0]?.id || occ.id) : occ.id,
    numero: invoiceNumber,
    path: `/Factures/${runName}/${filename}`,
    tiers: occ.tiers?.nom || 'Inconnu',
    annee: occ.anneeTaxation || year,
    total,
    lignes: lineResults,
    pdfBuffer
  };
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
