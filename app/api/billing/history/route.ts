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
      
      // Parse header
      // RECAPITULATIF FACTURATION CHANTIER - 18/03/2026 00:10 - Par: Jean Dupont
      const headerRegex = /RECAPITULATIF FACTURATION (.*?) - (.*?) - Par: (.*)/;
      let match = lines[0]?.match(headerRegex);
      
      let type = 'Inconnu';
      let date = '';
      let agent = 'Inconnu';

      if (match) {
        type = match[1];
        date = match[2];
        agent = match[3];
      } else {
        // Fallback for older files
        const oldRegex = /RECAPITULATIF FACTURATION (.*?) - (.*)/;
        const oldMatch = lines[0]?.match(oldRegex);
        if (oldMatch) {
          type = oldMatch[1];
          date = oldMatch[2];
        }
      }
      
      // Parse stats
      const totalStr = lines[1]?.split(': ')[1]?.replace(' EUR', '') || '0';
      const total = parseFloat(totalStr);
      const count = parseInt(lines[2]?.split(': ')[1] || '0');
      
      const invoices = [];
      
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (!line.startsWith('DET|')) {
           // Invoice line: 2026-ODP-1|Tiers Nom|500.00|1
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
      
      const baseName = filename.replace('.filien', '');
      
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
