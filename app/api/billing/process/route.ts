import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Helper to generate a single invoice PDF (simplified from the main one but consistent)
async function generateInvoicePdf(occ: any, gabarit: any, invoiceNumber: string) {
  const { elements } = JSON.parse(gabarit.contenu);
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  const replaceVars = (val: string) => {
    if (!val) return val;
    let result = val;
    const totalSum = occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || 0;

    const replacements: Record<string, string> = {
      '{id}': occ.id.toString(),
      '{nom}': occ.nom || '',
      '{tiers.nom}': occ.tiers.nom,
      '{adresse}': occ.adresse,
      '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
      '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
      '{totalTTC}': `${totalSum.toFixed(2)} €`,
      '{totalHT}': `${totalSum.toFixed(2)} €`,
      '{today}': format(new Date(), 'dd/MM/yyyy'),
      '{numeroFacture}': invoiceNumber
    };

    Object.entries(replacements).forEach(([key, value]) => {
      result = result.split(key).join(value);
    });
    return result;
  };

  // Basic rendering logic (simplified for batch)
  for (const el of (elements as any[])) {
    const x = el.x;
    const y = el.y;
    const w = el.width;
    const h = el.height;
    const style = el.style || {};

    if (el.type === 'RECT') {
      if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        doc.setFillColor(style.backgroundColor);
        doc.rect(x, y, w, h, 'F');
      }
    } else if (el.type === 'TEXT' || el.type === 'VARIABLE') {
      const text = el.type === 'VARIABLE' ? replaceVars(el.value) : el.value;
      if (!text) continue;
      doc.setFontSize(style.fontSize || 12);
      doc.setTextColor(style.color || '#000000');
      const weight = style.fontWeight === 'bold' || style.fontWeight === 'black' ? 'bold' : 'normal';
      doc.setFont('helvetica', weight);
      doc.text(text, x, y + (style.fontSize || 12));
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const agentName = session ? `${session.prenom} ${session.nom}` : 'Système';

    const { ids, type } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    // 1. Fetch data
    const [dossiers, gabarit] = await Promise.all([
      (prisma as any).occupation.findMany({
        where: { id: { in: ids } },
        include: { tiers: true, lignes: { include: { article: { include: { modeTaxation: true } } } } }
      }),
      (prisma as any).gabarit.findFirst({ where: { isDefault: true } })
    ]);

    if (!gabarit) return NextResponse.json({ error: 'Gabarit par défaut manquant' }, { status: 500 });

    const year = new Date().getFullYear();
    const now = new Date();
    // US Format Date-Time: YYYY-MM-DD-HHMM
    const timestampStr = format(now, 'yyyy-MM-dd-HHmm');
    
    const facturesDir = join(process.cwd(), 'public', 'Factures');
    if (!existsSync(facturesDir)) await mkdir(facturesDir, { recursive: true });

    // 2. Determine starting invoice index for the year
    const lastInvoices = await (prisma as any).occupation.findMany({
      where: { 
        numeroFacture: { startsWith: `${year}-ODP-` }
      },
      select: { numeroFacture: true }
    });

    let nextIndex = 1;
    if (lastInvoices.length > 0) {
      const indices = lastInvoices.map((i: any) => {
        const p = i.numeroFacture.split('-');
        return parseInt(p[p.length - 1]);
      }).filter((n: number) => !isNaN(n));
      if (indices.length > 0) {
        nextIndex = Math.max(...indices) + 1;
      }
    }

    const results = [];
    let grandTotal = 0;

    // 3. Process each dossier
    for (const occ of dossiers) {
      const invoiceNumber = `${year}-ODP-${nextIndex++}`;
      const pdfBuffer = await generateInvoicePdf(occ, gabarit, invoiceNumber);
      
      const filename = `${invoiceNumber}.pdf`;
      const fullPath = join(facturesDir, filename);
      await writeFile(fullPath, pdfBuffer);

      const total = occ.lignes?.reduce((s: number, l: any) => s + (l.montant || 0), 0) || 0;
      grandTotal += total;

      // Update dossier
      await (prisma as any).occupation.update({
        where: { id: occ.id },
        data: {
          statut: 'INVOICED',
          numeroFacture: invoiceNumber,
          facturePath: `/Factures/${filename}`
        }
      });

      results.push({ 
        id: occ.id, 
        numero: invoiceNumber, 
        path: `/Factures/${filename}`,
        tiers: occ.tiers.nom, 
        total,
        lignes: occ.lignes 
      });
    }

    // 4. Generate Recap PDF
    const recapDoc = new jsPDF();
    recapDoc.setFontSize(18);
    recapDoc.text(`Recapitulatif de Facturation - ${type}`, 20, 20);
    recapDoc.setFontSize(10);
    recapDoc.text(`Date: ${format(now, 'dd/MM/yyyy HH:mm')}`, 20, 30);
    recapDoc.text(`Nombre de dossiers: ${results.length}`, 20, 35);
    recapDoc.text(`Montant Total: ${grandTotal.toFixed(2)} €`, 20, 40);

    let y = 55;
    recapDoc.line(20, y - 5, 190, y - 5);
    results.forEach((r, i) => {
      if (y > 270) { recapDoc.addPage(); y = 20; }
      recapDoc.setFont('helvetica', 'bold');
      recapDoc.text(`${r.numero} - ${r.tiers}`, 20, y);
      recapDoc.setFont('helvetica', 'normal');
      recapDoc.text(`${r.total.toFixed(2)} €`, 170, y, { align: 'right' });
      y += 5;
      r.lignes.forEach((l: any) => {
        recapDoc.text(`  - ${l.article.designation}: ${l.montant.toFixed(2)} €`, 25, y);
        y += 5;
      });
      y += 5;
    });

    const recapFilename = `FACT-${timestampStr}.pdf`;
    const recapPath = join(facturesDir, recapFilename);
    await writeFile(recapPath, Buffer.from(recapDoc.output('arraybuffer')));

    // 5. Generate .filien Flat File
    let filienContent = `RECAPITULATIF FACTURATION ${type} - ${format(now, 'dd/MM/yyyy HH:mm')} - Par: ${agentName}\n`;
    filienContent += `TOTAL: ${grandTotal.toFixed(2)} EUR\n`;
    filienContent += `COUNT: ${results.length}\n`;
    filienContent += `--------------------------------------------------\n`;
    
    results.forEach(r => {
      filienContent += `${r.numero}|${r.tiers}|${r.total.toFixed(2)}|${r.id}\n`;
      r.lignes.forEach((l: any) => {
        filienContent += `  DET|${l.article.numero}|${l.article.designation}|${l.montant.toFixed(2)}\n`;
      });
    });

    const filienFilename = `FACT-${timestampStr}.filien`;
    const filienPath = join(facturesDir, filienFilename);
    await writeFile(filienPath, filienContent);

    return NextResponse.json({
      success: true,
      count: results.length,
      total: grandTotal,
      recapPdf: `/Factures/${recapFilename}`,
      filienPath: `/Factures/${filienFilename}`,
      invoices: results.map(r => ({ id: r.id, numero: r.numero, path: r.path, tiers: r.tiers }))
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
