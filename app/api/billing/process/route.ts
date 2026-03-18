import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Helper to generate a single invoice PDF (mirrors the main facture-pdf engine)
async function generateInvoicePdf(occ: any, gabarit: any, invoiceNumber: string) {
  const { elements } = JSON.parse(gabarit.contenu);
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });
  // NO watermark for mass billing - these are official invoices

  const replaceVars = (val: string, ligne?: any) => {
    if (!val) return val;
    let result = val;
    const totalSum = occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || 0;

    const replacements: Record<string, string> = {
      '{id}': occ.id.toString(),
      '{nom}': occ.nom || '',
      '{tiers.nom}': occ.tiers?.nom || '',
      '{adresse}': occ.adresse || '',
      '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
      '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
      '{numeroFacture}': invoiceNumber,
      '{periode}': occ.anneeTaxation ? occ.anneeTaxation.toString() : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear().toString() : new Date().getFullYear().toString()),
      '{totalTTC}': `${totalSum.toFixed(2)} €`,
      '{totalHT}': `${totalSum.toFixed(2)} €`,
      '{today}': format(new Date(), 'dd/MM/yyyy'),
    };

    if (ligne && ligne.article) {
      replacements['{article.designation}'] = ligne.article.designation || '';
      replacements['{article.quantite}'] = (ligne.quantite1 || 0).toString();
      replacements['{article.pu}'] = `${(ligne.article.montant || 0).toFixed(2)} €`;
      replacements['{article.totalHT}'] = `${(ligne.montant || 0).toFixed(2)} €`;
    }

    Object.entries(replacements)
      .sort((a, b) => b[0].length - a[0].length) // Longest keys first
      .forEach(([key, value]) => {
        result = result.split(key).join(value);
      });
    return result;
  };

  for (const el of (elements as any[])) {
    const x = el.x;
    const style = el.style || {};

    const isRepeated = el.isArticleRepeated || (typeof el.value === 'string' && el.value.includes('{article.'));
    const instances = (isRepeated && occ.lignes && occ.lignes.length > 0) ? occ.lignes : [null];

    for (let idx = 0; idx < instances.length; idx++) {
      const ligne = instances[idx];
      const pitch = el.verticalPitch || (isRepeated && !el.isArticleRepeated ? 25 : 30);
      const y = el.y + (idx * pitch);
      const w = el.width;
      const h = el.height;

      if (el.type === 'RECT' && !style.noBackground) {
        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
          doc.setFillColor(style.backgroundColor);
          doc.rect(x, y, w, h, 'F');
        }
        if (style.borderWidth > 0) {
          doc.setDrawColor(style.borderColor || '#000000');
          doc.setLineWidth(style.borderWidth);
          doc.rect(x, y, w, h, 'S');
        }
      } else if (el.type === 'TEXT' || el.type === 'VARIABLE') {
        const text = replaceVars(el.value, ligne);
        if (!text) continue;
        const fontSize = style.fontSize || 12;
        doc.setFontSize(fontSize);
        doc.setTextColor(style.color || '#000000');
        const weight = style.fontWeight === 'bold' || style.fontWeight === 'black' ? 'bold' : 'normal';
        let family = 'helvetica';
        if (style.fontFamily?.includes('Times')) family = 'times';
        else if (style.fontFamily?.includes('Courier')) family = 'courier';
        doc.setFont(family, weight);
        const lines = text.split('\n');
        lines.forEach((line: string, lineIdx: number) => {
          const splitLine = doc.splitTextToSize(line, w);
          if (style.textAlign === 'center') {
            doc.text(splitLine, x + w / 2, y + fontSize + (lineIdx * fontSize * 1.2), { align: 'center' });
          } else if (style.textAlign === 'right') {
            doc.text(splitLine, x + w, y + fontSize + (lineIdx * fontSize * 1.2), { align: 'right' });
          } else {
            doc.text(splitLine, x, y + fontSize + (lineIdx * fontSize * 1.2));
          }
        });
      }
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

    // 5. Generate .filien Flat File (Official Format)
    const settings = await (prisma as any).appSettings.findFirst();
    const filienParams = {
      orga: settings?.filienOrga || '01',
      budget: settings?.filienBudget || 'BA',
      exercice: settings?.filienExercice || year,
      avancement: settings?.filienAvancement || '5',
      rejetDispo: settings?.filienRejetDispo ?? true,
      rejetCA: settings?.filienRejetCA ?? false,
      rejetMarche: settings?.filienRejetMarche ?? false,
      filienChapitre: settings?.filienChapitre || '',
      filienNature: settings?.filienNature || '',
      filienFonction: settings?.filienFonction || '',
      filienCodeInterne: settings?.filienCodeInterne || '',
      filienTypeMouvement: settings?.filienTypeMouvement || '',
      filienSens: settings?.filienSens || '',
      filienStructure: settings?.filienStructure || '',
      filienGestionnaire: settings?.filienGestionnaire || '',
    };

    const { generateFilienFile } = require('@/lib/filien');
    
    const movements = results.map((r, idx) => {
      // Find the original occupation to get tiers details etc.
      const occ = dossiers.find((d: any) => d.id === r.id);
      
      return {
        id: r.numero.replace(/-/g, '').slice(-10), // Use invoice number digits as movement ID
        type: settings?.filienType || 'R',
        tiersCode: occ?.tiers?.code_sedit || 'TIERS_INCONNU',
        libelle: settings?.filienLibelle || occ?.nom || `Dossier #${occ?.id}`,
        calendrier: settings?.filienCalendrier || '01',
        monnaie: settings?.filienMonnaie || 'E',
        existant: settings?.filienMouvementEx || 'N',
        preBordereau: settings?.filienPreBordereau || '1235',
        poste: settings?.filienPoste || '0001',
        bordereau: settings?.filienBordereau || '0001',
        objet: settings?.filienObjet || '',
        lines: (occ?.lignes || []).map((l: any, lIdx: number) => ({
          numero: lIdx + 1,
          imputation: l.article?.numero || 'IMPUT_VIDE',
          montant: l.montant,
          dateDebut: l.dateDebut || undefined,
          dateFin: l.dateFin || undefined,
          description: l.article?.designation || '',
          quantite: l.quantite1 || 1,
          prixUnitaire: l.article?.montant || l.montant,
          // Analytical Ventilation (fallback to article or settings)
          chapitre: l.article?.chapitre || '',
          nature: l.article?.nature || '',
          fonction: l.article?.fonction || '',
          codeInterne: l.article?.codeInterne || '',
          typeMouvement: l.article?.typeMouvement || '',
          sens: l.article?.sens || '',
          structure: l.article?.structure || '',
          gestionnaire: l.article?.gestionnaire || ''
        }))
      };
    });

    const filienContent = generateFilienFile(filienParams, movements);
    const filienFilename = `FACT-${timestampStr}.filien`;
    const filienPath = join(facturesDir, filienFilename);
    await writeFile(filienPath, filienContent);

    return NextResponse.json({
      success: true,
      count: results.length,
      total: grandTotal,
      recapPdf: `/Factures/${recapFilename}`,
      filienPath: `/Factures/${filienFilename}`,
      invoices: results.map((r: any) => ({ id: r.id, numero: r.numero, path: r.path, tiers: r.tiers }))
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
