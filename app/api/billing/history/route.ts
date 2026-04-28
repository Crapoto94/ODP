import { NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink, readdir, readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch from Database
    const dbRuns = await (prisma as any).billingRun.findMany({
      include: { invoices: true },
      orderBy: { date: 'desc' }
    });

    const dbHistory = dbRuns.map((run: any) => ({
      ...run,
      date: run.date ? new Date(run.date).toLocaleString('fr-FR') : 'Date inconnue',
      source: 'db'
    }));

    // 2. Fetch from Filesystem (Legacy)
    const facturesDir = join(process.cwd(), 'public', 'Factures');
    const legacyHistory: any[] = [];
    
    if (existsSync(facturesDir)) {
      const items = await readdir(facturesDir, { withFileTypes: true });
      const filienFiles = items
        .filter(item => !item.isDirectory() && item.name.startsWith('FACT-') && item.name.endsWith('.filien'))
        .map(item => item.name);
      
      const subDirs = items.filter(item => item.isDirectory()).map(item => item.name);
      
      // Filter out files that already exist in DB to avoid duplicates
      const dbIds = new Set(dbRuns.map((r: any) => r.id));
      const legacyFiles = filienFiles.filter((f: string) => !dbIds.has(f.replace('.filien', '')));

      const parsedLegacy = await Promise.all(legacyFiles.map(async (filename: string) => {
        try {
          const content = await readFile(join(facturesDir, filename), 'utf-8');
          const lines = content.split('\n');
          const baseName = filename.replace('.filien', '');
          
          let date = '';
          const dateParts = baseName.split('-');
          if (dateParts.length >= 5) {
            date = `${dateParts[3]}/${dateParts[2]}/${dateParts[1]} ${dateParts[4].slice(0, 2)}:${dateParts[4].slice(2)}`;
          }

          let type = 'Inconnu';
          let total = 0;
          let count = 0;
          const invoices: any[] = [];

          const isFilienFormat = content.includes('/PARAM/') || content.startsWith('/##/');

          if (isFilienFormat) {
            for (const line of lines) {
              if (line.startsWith('/01/')) {
                count++;
                const raw = line.replace('/01/', '').trim();
                let numero = raw;
                if (raw.includes('ODP')) {
                  const p = raw.split('ODP');
                  numero = `${p[0]}-ODP-${p[1]}`;
                }
                let pdfPath = `/Factures/${numero}.pdf`;
                // Try to find it in subfolders if not in root
                if (!existsSync(join(facturesDir, `${numero}.pdf`))) {
                  for (const sd of subDirs) {
                    if (existsSync(join(facturesDir, sd, `${numero}.pdf`))) {
                      pdfPath = `/Factures/${sd}/${numero}.pdf`;
                      break;
                    }
                  }
                }
                invoices.push({ numero, tiers: '...', total: 0, pdfPath });
              } else if (line.startsWith('/66/')) {
                total += parseFloat(line.replace('/66/', '').replace(',', '.') || '0');
              } else if (line.startsWith('/PARAM/')) {
                const p = line.split('/');
                if (p[2] === '30') type = 'TLPE';
                else if (p[2] === '01') type = 'Commerce / ODP';
                else type = 'Facturation';
              }
            }
          }

          return {
            id: baseName,
            type,
            date,
            agent: 'Système (Ancien)',
            total,
            count,
            recapPath: `/Factures/${baseName}.pdf`,
            filienPath: `/Factures/${filename}`,
            invoices,
            source: 'file'
          };
        } catch (e) {
          return null;
        }
      }));
      
      parsedLegacy.forEach(h => { if (h) legacyHistory.push(h); });
    }

    // 3. Merge and Sort
    const combined = [...dbHistory, ...legacyHistory].sort((a, b) => {
      // Sort by chronological ID (FACT-YYYY-MM-DD-HHmm)
      return b.id.localeCompare(a.id);
    });

    return NextResponse.json(combined);
  } catch (error: any) {
    console.error('[HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    // 1. Find the run and associated invoices
    const run = await (prisma as any).billingRun.findUnique({
      where: { id },
      include: { invoices: true }
    });

    if (!run) return NextResponse.json({ error: 'Train de facturation introuvable' }, { status: 404 });

    // 2. Revert dossier statuses
    const invoiceIds = run.invoices.map((inv: any) => inv.dossierId);
    if (invoiceIds.length > 0) {
      await (prisma as any).occupation.updateMany({
        where: { id: { in: invoiceIds } },
        data: {
          statut: 'VERIFIE',
          numeroFacture: null,
          facturePath: null
        }
      });
    }

    // 3. Delete files from disk
    const facturesDir = join(process.cwd(), 'public', 'Factures');
    
    // Delete individual invoices
    for (const inv of run.invoices) {
      const filePath = join(process.cwd(), 'public', inv.pdfPath);
      if (existsSync(filePath)) await unlink(filePath).catch(() => {});
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

    // 4. Delete the record from DB
    await (prisma as any).billingRun.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
