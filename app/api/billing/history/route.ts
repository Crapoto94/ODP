import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const facturesDir = join(process.cwd(), 'public', 'Factures');
    if (!existsSync(facturesDir)) {
      return NextResponse.json([]);
    }

    const files = await readdir(facturesDir);
    const filienFiles = files.filter(f => f.startsWith('FACT-') && f.endsWith('.filien'));

    const history = await Promise.all(filienFiles.map(async (filename) => {
      const content = await readFile(join(facturesDir, filename), 'utf-8');
      const lines = content.split('\n');
      const baseName = filename.replace('.filien', '');
      
      // Parse date from filename: FACT-2023-10-31-0830
      let date = '';
      const dateParts = baseName.split('-');
      if (dateParts.length >= 5) {
        date = `${dateParts[3]}/${dateParts[2]}/${dateParts[1]} ${dateParts[4].slice(0, 2)}:${dateParts[4].slice(2)}`;
      }

      let type = 'Inconnu';
      let agent = 'Système';
      let total = 0;
      let count = 0;
      const invoices: any[] = [];

      // Detect Format
      const isFilienFormat = content.includes('/PARAM/') || content.startsWith('/##/');

      if (isFilienFormat) {
        // Parse technical Filien format
        let currentInvoice: any = null;
        
        for (const line of lines) {
          if (line.startsWith('/01/')) {
            count++;
            const raw = line.replace('/01/', '').trim();
            // Try to recover ODP format: 2026ODP1 -> 2026-ODP-1
            let numero = raw;
            if (raw.includes('ODP')) {
              const p = raw.split('ODP');
              numero = `${p[0]}-ODP-${p[1]}`;
            }
            currentInvoice = { numero, tiers: '', total: 0, pdf: `/Factures/${numero}.pdf` };
            invoices.push(currentInvoice);
          } else if (line.startsWith('/03/') && currentInvoice) {
            // Sedit code, we don't have the name here yet, wait for /04/
          } else if (line.startsWith('/04/') && currentInvoice) {
            currentInvoice.tiers = line.replace('/04/', '').trim();
          } else if (line.startsWith('/66/') && currentInvoice) {
            const val = parseFloat(line.replace('/66/', '').replace(',', '.') || '0');
            currentInvoice.total += val;
            total += val;
          } else if (line.startsWith('/PARAM/')) {
            // /PARAM/30/01/2026/...
            const p = line.split('/');
            if (p[2] === '30') type = 'TLPE';
            else if (p[2] === '01') type = 'Commerce';
            else type = 'Facturation';
          }
        }
      } else {
        // Parse legacy/human format
        const headerRegex = /RECAPITULATIF FACTURATION (.*?) - (.*?) - Par: (.*)/;
        let match = lines[0]?.match(headerRegex);
        
        if (match) {
          type = match[1];
          if (!date) date = match[2];
          agent = match[3];
        } else {
          const oldRegex = /RECAPITULATIF FACTURATION (.*?) - (.*)/;
          const oldMatch = lines[0]?.match(oldRegex);
          if (oldMatch) {
            type = oldMatch[1];
            if (!date) date = oldMatch[2];
          }
        }
        
        total = parseFloat(lines[1]?.split(': ')[1]?.replace(' EUR', '') || '0');
        count = parseInt(lines[2]?.split(': ')[1] || '0');
        
        for (let i = 4; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('DET|')) continue;
          
          const parts = line.split('|');
          if (parts.length >= 4) {
            invoices.push({
              numero: parts[0],
              tiers: parts[1],
              total: parseFloat(parts[2]),
              dossierId: parseInt(parts[3]),
              pdf: `/Factures/${parts[0]}.pdf`
            });
          }
        }
      }

      return {
        id: baseName,
        type,
        date,
        agent,
        total,
        count,
        recapPdf: `/Factures/${baseName}.pdf`,
        filienPath: `/Factures/${filename}`,
        invoices
      };
    }));

    // Sort by chronological order (descending): assuming FACT-YYYY-MM-DD-HHmm
    history.sort((a, b) => b.id.localeCompare(a.id));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('[HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
