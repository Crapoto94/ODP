import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Refactored Services
import { processDossier, ProcessedInvoice } from '@/lib/billing/invoice-processor';
import { generateRecapPdf, processFilienExport } from '@/lib/billing/batch-service';
import { distributeInvoiceBatch } from '@/lib/billing/distribution-service';
import { sendFinanceNotification } from '@/lib/billing/notification-service';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';

export async function POST(req: NextRequest) {
  console.log('--- REFRESHED BILLING PROCESS (REFACTORED) ---');
  try {
    const session = await getSession();
    const agentName = session ? `${session.prenom} ${session.nom}` : 'Système';

    const { ids, type } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    // 1. Fetch data & Settings
    const currentYear = new Date().getFullYear();
    const [dossiers, appSettings, tlpeConfig] = await Promise.all([
      fetchDossiers(ids, type),
      (prisma as any).appSettings.findFirst({ where: { id: 1 } }),
      (prisma as any).tlpeConfig.findUnique({ where: { annee: currentYear } })
    ]);

    if (!appSettings) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 500 });

    const now = new Date();
    const timestampStr = format(now, 'yyyy-MM-dd-HHmm');
    const runName = timestampStr;
    const facturesDir = join(process.cwd(), 'public', 'Factures', runName);
    if (!existsSync(facturesDir)) await mkdir(facturesDir, { recursive: true });

    const year = now.getFullYear();
    let nextIndex = await getNextInvoiceIndex(year);

    const results: ProcessedInvoice[] = [];
    let grandTotal = 0;

    // 2. Process each dossier
    for (const occ of dossiers) {
      const invoiceNumber = `${year}-ODP-${nextIndex++}`;

      const processed = await processDossier({
        occ,
        invoiceNumber,
        tlpeConfig,
        year,
        facturesDir,
        runName,
        agentName
      });

      // 3. Automated Distribution (New Feature)
      if (appSettings.autoDistributeInvoices) {
        // Condition: if distributeOnlyVerified is true, we already filtered dossiers by status in fetchDossiers
        // but double check here if needed.
        console.log(`[AUTO-DISTRIBUTE] Sending invoice ${invoiceNumber} for dossier ${processed.id}`);
        
        // We need the buffer for distribution. Since processor already saved it, we could read it or 
        // the processor could return it. For now, let's regenerate or optimize later.
        // Optimization: Passing buffer from processor is better. (I'll update processor later if needed)
        const { buffer } = await generateInvoicePdfBuffer(occ.isCommerceGroup ? null : occ.id, {
          invoiceNumber,
          tlpeConfig,
          occupationIds: occ.isCommerceGroup ? occ.occupationsIncluded.map((o: any) => o.id) : undefined,
          annee: occ.anneeTaxation || year,
          forceRed: true
        });

        await distributeInvoiceBatch({
          occupationId: processed.id,
          invoiceNumber: processed.numero,
          pdfBuffer: buffer,
          agentName
        });
      }

      grandTotal += processed.total;
      results.push(processed);
    }

    // 4. Batch level operations
    const recap = await generateRecapPdf({ results, type: type || 'Batch', grandTotal, now, facturesDir, timestampStr });

    const odpConfigs = await (prisma as any).odpConfig.findMany({
      where: { annee: { in: Array.from(new Set(dossiers.map((d: any) => d.anneeTaxation || year))) } }
    });
    const odpConfigMap = odpConfigs.reduce((acc: any, cfg: any) => ({ ...acc, [cfg.annee]: cfg }), {});

    const filienPath = await processFilienExport({
      results, dossiers, appSettings, odpConfigMap, year, runName, timestampStr, facturesDir,
      recapFilename: recap.filename, recapPath: recap.path
    });

    // 5. DB Run Record
    const billingRunId = `FACT-${timestampStr}`;
    await recordBillingRun(billingRunId, type, now, results, grandTotal, agentName, recap.filename, runName, timestampStr);

    // 6. Notification
    await sendFinanceNotification({ appSettings, session, billingRunId, resultsCount: results.length, dossiers, agentName, runName, filienPath });

    return NextResponse.json({
      success: true,
      count: results.length,
      total: grandTotal,
      recapPdf: `/Factures/${runName}/${recap.filename}`,
      filienPath: `/Factures/${runName}/FACT-${timestampStr}.filien.txt`,
      billingRunId,
      invoices: results
    });

  } catch (err: any) {
    console.error('[BILLING PROCESS ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function fetchDossiers(ids: number[], type: string) {
  if (type === 'COMMERCE') {
    const occupations = await (prisma as any).occupation.findMany({
      where: { tiersId: { in: ids }, type: 'COMMERCE', statut: { in: ['VERIFIE', 'VALIDE', 'VALIDÉ'] } },
      include: { tiers: true, lignes: { include: { article: { include: { modeTaxation: true } } } } }
    });
    const grouped = new Map();
    occupations.forEach((occ: any) => {
      if (!grouped.has(occ.tiersId)) {
        grouped.set(occ.tiersId, {
          id: occ.tiersId,
          isCommerceGroup: true,
          type: 'COMMERCE',
          tiers: occ.tiers,
          anneeTaxation: occ.anneeTaxation,
          occupationsIncluded: [occ],
          lignes: [...occ.lignes]
        });
      } else {
        grouped.get(occ.tiersId).occupationsIncluded.push(occ);
        grouped.get(occ.tiersId).lignes.push(...occ.lignes);
      }
    });
    return Array.from(grouped.values());
  } else {
    const occupations = await (prisma as any).occupation.findMany({
      where: { id: { in: ids } },
      include: { tiers: true, lignes: { include: { article: { include: { modeTaxation: true } } } } }
    });
    // Ensure all occupations have isCommerceGroup and occupationsIncluded properties
    return occupations.map((occ: any) => ({
      ...occ,
      isCommerceGroup: false,
      occupationsIncluded: [occ]
    }));
  }
}

async function getNextInvoiceIndex(year: number) {
  const lastInvoices = await (prisma as any).occupation.findMany({
    where: { numeroFacture: { startsWith: `${year}-ODP-` } },
    select: { numeroFacture: true }
  });
  let nextIndex = 1;
  if (lastInvoices.length > 0) {
    const indices = lastInvoices.map((i: any) => {
      const p = i.numeroFacture.split('-');
      return parseInt(p[p.length - 1]);
    }).filter((n: number) => !isNaN(n));
    if (indices.length > 0) nextIndex = Math.max(...indices) + 1;
  }
  return nextIndex;
}

async function recordBillingRun(id: string, type: string, date: Date, results: ProcessedInvoice[], total: number, agent: string, recapFilename: string, runName: string, timestampStr: string) {
  try {
    console.log(`[BILLING RUN] Starting record with ID: ${id}`);

    // Check if billingRun table exists
    try {
      const existing = await (prisma as any).billingRun.findFirst();
      console.log(`[BILLING RUN] Table check passed`);
    } catch (tableErr: any) {
      console.error(`[BILLING RUN] Table check failed:`, tableErr.message);
      throw new Error(`billingRun table may not exist: ${tableErr.message}`);
    }

    // Create billing run
    const result = await (prisma as any).billingRun.create({
      data: {
        id,
        type: type || 'Facturation',
        date,
        count: results.length,
        total,
        agent,
        recapPath: `/Factures/${runName}/${recapFilename}`,
        filienPath: `/Factures/${runName}/FACT-${timestampStr}.filien.txt`
      }
    });

    // Create invoices separately
    if (results.length > 0) {
      await (prisma as any).billingRunInvoice.createMany({
        data: results.map(r => ({
          billingRunId: id,
          dossierId: r.id,
          numero: r.numero,
          tiers: r.tiers,
          total: r.total,
          pdfPath: r.path
        }))
      });
    }

    console.log(`[BILLING RUN RECORDED] ID: ${id}, Count: ${results.length}, Total: ${total}, Result:`, result);
  } catch (err: any) {
    console.error('[DB RUN RECORD ERROR]', err.message);
    console.error('[DB RUN RECORD ERROR FULL]', err);
  }
}
