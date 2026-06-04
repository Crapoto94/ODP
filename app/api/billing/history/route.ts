import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const idFilter = searchParams.get('id');
  try {
    const dbRuns = await (prisma as any).billingRun.findMany({
      orderBy: { date: 'desc' }
    });

    const history = dbRuns.map((run: any) => ({
      ...run,
      invoices: [],
      date: run.date ? new Date(run.date).toLocaleString('fr-FR') : 'Date inconnue'
    }));

    // Fetch invoices separately with error handling
    for (const run of history as any[]) {
      try {
        run.invoices = await (prisma as any).billingRunInvoice.findMany({
          where: { billingRunId: run.id }
        });
      } catch (err: any) {
        console.error(`[HISTORY] Failed to fetch invoices for run ${run.id}:`, err.message);
        run.invoices = [];
      }
    }

    if (idFilter) {
      const filtered = history.filter((run: any) => run.id === idFilter);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('[HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    // 1. Find the run first without invoices to avoid data corruption issues
    let run: any;
    try {
      run = await (prisma as any).billingRun.findUnique({
        where: { id }
      });
    } catch (err: any) {
      console.error(`[DELETE] Error finding billingRun ${id}:`, err.message);
      return NextResponse.json({ error: 'Erreur lors de la lecture du train de facturation' }, { status: 500 });
    }

    if (!run) return NextResponse.json({ error: 'Train de facturation introuvable' }, { status: 404 });

    // 2. Fetch invoice numbers separately to avoid corruption errors
    let invoiceNumeros: string[] = [];
    try {
      const invoices = await (prisma as any).billingRunInvoice.findMany({
        where: { billingRunId: id },
        select: { numero: true }
      });
      invoiceNumeros = invoices.map((inv: any) => inv.numero).filter((n: any) => !!n);
    } catch (err: any) {
      console.error(`[DELETE] Error fetching invoices for ${id}:`, err.message);
    }

    // 3. Revert dossier statuses — keyed on numeroFacture so that EVERY occupation
    //    carrying the cancelled invoice number is reverted. A commerce/year invoice
    //    can cover several occupations, while billingRunInvoice only stores the first
    //    one's id; reverting by id would leave the others stuck in "FACTURE".
    if (invoiceNumeros.length > 0) {
      await (prisma as any).occupation.updateMany({
        where: { numeroFacture: { in: invoiceNumeros } },
        data: {
          statut: 'VERIFIE',
          numeroFacture: null,
          facturePath: null
        }
      });
    }

    // 4. Delete files from disk
    const facturesDir = join(process.cwd(), 'public', 'Factures');

    // Delete individual invoice files
    try {
      const invoiceFiles = await (prisma as any).billingRunInvoice.findMany({
        where: { billingRunId: id },
        select: { pdfPath: true }
      });
      for (const inv of invoiceFiles) {
        if (inv.pdfPath) {
          const filePath = join(process.cwd(), 'public', inv.pdfPath);
          if (existsSync(filePath)) await unlink(filePath).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error(`[DELETE] Error deleting invoice files for ${id}:`, err.message);
    }

    // Delete recap and filien files
    if (run.recapPath) {
      const recapPath = join(process.cwd(), 'public', run.recapPath);
      if (existsSync(recapPath)) await unlink(recapPath).catch(() => {});
    }
    if (run.filienPath) {
      const filienPath = join(process.cwd(), 'public', run.filienPath);
      if (existsSync(filienPath)) await unlink(filienPath).catch(() => {});
    }

    // 5. Delete invoices and the run from DB
    try {
      // Delete invoices first
      await (prisma as any).billingRunInvoice.deleteMany({
        where: { billingRunId: id }
      });
      // Then delete the run
      await (prisma as any).billingRun.delete({ where: { id } });
      console.log(`[DELETE] Successfully deleted billing run ${id}`);
    } catch (err: any) {
      console.error(`[DELETE] Error deleting from database:`, err.message);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
