import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import jsPDF from 'jspdf';
import { format, differenceInDays, isLeapYear } from 'date-fns';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Helper to generate a single invoice PDF (mirrors the main facture-pdf engine)
async function generateInvoicePdf(occ: any, gabarit: any, invoiceNumber: string, tlpeConfig: any = null) {
  const { elements } = JSON.parse(gabarit.contenu);
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  const replaceVars = (val: string, ligne?: any) => {
    if (!val) return val;
    let result = val;
    
    // TLPE Logic Prep
    const threshold = tlpeConfig?.exoneration ?? 12;
    const totalEnseigneSurface = (occ.lignes || []).reduce((sum: number, l: any) => {
      let mt: any = {};
      try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
      if (mt.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
      return sum;
    }, 0) || 0;
    const isEnseigneExempt = totalEnseigneSurface <= threshold;

    const totalSum = (occ.lignes || []).reduce((sum: number, l: any) => {
      let mt: any = {};
      try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
      if (occ.type === 'TLPE') {
        if (mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt) return sum;
        const d1 = new Date(l.dateDebut);
        const d2 = new Date(l.dateFin);
        const year = (occ as any).anneeTaxation || d1.getFullYear();
        const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
        const daysActive = differenceInDays(d2, d1) + 1;
        const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
        const pu = (l.montant || 0);
        return sum + (pu * (l.quantite1 || 0) * prorata);
      }
      return sum + (l.montant || 0);
    }, 0) || 0;

    const TYPE_MAP: Record<string, string> = {
      'COMMERCE': 'Commerce',
      'CHANTIER': 'Chantier',
      'TOURNAGE': 'Tournage',
      'TLPE': 'TLPE',
    };

    const formatAddress = (addr: string) => {
      if (!addr) return '';
      const match = addr.match(/^(.*?)(\d{5}\s+.*)$/);
      if (match) return `${match[1].trim()}\n${match[2].trim()}`;
      return addr;
    };

    const replacements: Record<string, string> = {
      '{id}': occ.id.toString(),
      '{type}': TYPE_MAP[occ.type] || occ.type,
      '{nom}': occ.nom || '',
      '{tiers.nom}': occ.tiers?.nom || '',
      '{adresse}': formatAddress(occ.adresse || ''),
      '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
      '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
      '{numeroFacture}': invoiceNumber,
      '{periode}': occ.anneeTaxation ? occ.anneeTaxation.toString() : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear().toString() : new Date().getFullYear().toString()),
      '{totalTTC}': `${totalSum.toFixed(2)} €`,
      '{totalHT}': `${totalSum.toFixed(2)} €`,
      '{today}': format(new Date(), 'dd/MM/yyyy'),
    };

    if (ligne && ligne.article) {
      let mt: any = {};
      try { mt = ligne.article.notes ? JSON.parse(ligne.article.notes) : {}; } catch(e){}
      
      const d1 = new Date(ligne.dateDebut);
      const d2 = new Date(ligne.dateFin);
      const dateStr = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
      
      const occD1 = occ.dateDebut ? new Date(occ.dateDebut) : null;
      const occD2 = occ.dateFin ? new Date(occ.dateFin) : null;
      const isDifferentDates = !occD1 || !occD2 || 
        format(d1, 'yyyy-MM-dd') !== format(occD1, 'yyyy-MM-dd') || 
        format(d2, 'yyyy-MM-dd') !== format(occD2, 'yyyy-MM-dd');
      
      replacements['{article.designation}'] = ligne.article.designation || '';
      replacements['{article.designationcomplete}'] = isDifferentDates 
        ? `${ligne.article.designation || ''} du ${dateStr}` 
        : (ligne.article.designation || '');
      replacements['{article.note}'] = ligne.note || '';
      
      // Handle Units and Quantities
      const modeParts = (ligne.article.modeTaxation?.nom || 'unité').split('/');
      const unit = modeParts[1] || modeParts[0] || '';
      const timeUnit = modeParts[2] || (ligne.article.modeTaxation?.nom?.toLowerCase().includes('jour') ? 'jours' : 'mois');
      
      let qteFull = `${ligne.quantite1 || 0} ${unit}`;
      if (ligne.quantite2 > 0) {
        qteFull += ` x ${ligne.quantite2} ${timeUnit}`;
      }
      replacements['{article.quantite}'] = qteFull;
      replacements['{article.dates}'] = dateStr;
      
      const pu = occ.type === 'TLPE' ? (ligne.montant || 0) : (ligne.article.montant || 0);
      let lineVal = (ligne.montant || 0); // Corrected: ligne.montant is already the total
      let detailStr = '';

      if (occ.type === 'TLPE') {
        const year = (occ as any).anneeTaxation || d1.getFullYear();
        const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
        const daysActive = differenceInDays(d2, d1) + 1;
        const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
        const isExempt = mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt;
        lineVal = isExempt ? 0 : (pu * (ligne.quantite1 || 0) * prorata);
        detailStr = `${ligne.quantite1} m² à ${pu.toFixed(2)}€/m²${prorata < 1 ? ` (prorata ${daysActive}j/${daysInYear}j)` : ''}${isExempt ? ' (Exonéré)' : ''}`;
      } else {
        detailStr = `${ligne.quantite1} ${unit}`;
        if (ligne.quantite2 > 0) {
          detailStr += ` x ${ligne.quantite2} ${timeUnit}`;
        }
        detailStr += ` à ${pu.toFixed(2)}€`;
      }

      replacements['{article.details}'] = detailStr;
      replacements['{article.pu}'] = `${pu.toFixed(2)} €`;
      replacements['{article.totalHT}'] = `${lineVal.toFixed(2)} €`;
      replacements['{article.full_description}'] = `${ligne.article.designation}\n${dateStr}\n${detailStr}`;
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
        const fontStyle = style.italic ? 'italic' : weight;
        let family = 'helvetica';
        if (style.fontFamily?.includes('Times')) family = 'times';
        else if (style.fontFamily?.includes('Courier')) family = 'courier';
        doc.setFont(family, fontStyle);
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
  console.log('--- REFRESHED BILLING PROCESS ---');
  try {
    const session = await getSession();
    const agentName = session ? `${session.prenom} ${session.nom}` : 'Système';

    const { ids, type } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    // 1. Fetch data
    const [dossiers, gabarit, settingsRecords] = await Promise.all([
      (prisma as any).occupation.findMany({
        where: { id: { in: ids } },
        include: { tiers: true, lignes: { include: { article: { include: { modeTaxation: true } } } } }
      }),
      (prisma as any).gabarit.findFirst({ where: { isDefault: true } }),
      (prisma as any).$queryRaw`SELECT * FROM AppSettings WHERE id = 1`
    ]);

    const appSettings = (settingsRecords as any[])[0] || null;

    if (!gabarit) return NextResponse.json({ error: 'Gabarit par défaut manquant' }, { status: 500 });
    
    // For Regulatory attachments, we need the config for the year
    const year = new Date().getFullYear();
    const records = await (prisma as any).$queryRaw`SELECT * FROM TlpeConfig WHERE annee = ${year}` as any[];
    const tlpeConfig = records[0] || null;

    const now = new Date();
    // US Format Date-Time: YYYY-MM-DD-HHMM
    const timestampStr = format(now, 'yyyy-MM-dd-HHmm');
    
    const runName = timestampStr;
    const facturesBaseDir = join(process.cwd(), 'public', 'Factures');
    const facturesDir = join(facturesBaseDir, runName);
    
    if (!existsSync(facturesBaseDir)) await mkdir(facturesBaseDir, { recursive: true });
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
      const pdfBuffer = await generateInvoicePdf(occ, gabarit, invoiceNumber, tlpeConfig);
      
      const filename = `${invoiceNumber}.pdf`;
      const fullPath = join(facturesDir, filename);
      await writeFile(fullPath, pdfBuffer);

      const threshold = tlpeConfig?.exoneration ?? 12;
      const totalEnseigneSurface = (occ.lignes || []).reduce((sum: number, l: any) => {
        let mt: any = {};
        try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
        if (mt.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
        return sum;
      }, 0) || 0;
      const isEnseigneExempt = totalEnseigneSurface <= threshold;

      const lineResults: any[] = [];
      const total = (occ.lignes || []).reduce((sum: number, l: any) => {
          let mt: any = {};
          try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
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

      grandTotal += total;

      // Update dossier
      await (prisma as any).occupation.update({
        where: { id: occ.id },
        data: {
          statut: 'FACTURE',
          numeroFacture: invoiceNumber,
          facturePath: `/Factures/${runName}/${filename}`
        }
      });

      results.push({ 
        id: occ.id, 
        numero: invoiceNumber, 
        path: `/Factures/${runName}/${filename}`,
        tiers: occ.tiers.nom, 
        total,
        lignes: lineResults 
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
        recapDoc.text(`  - ${l.article.designation}: ${l.calculatedTotal.toFixed(2)} €`, 25, y);
        y += 5;
      });
      y += 5;
    });

    const recapFilename = `FACT-${timestampStr}.pdf`;
    const recapPath = join(facturesDir, recapFilename);
    await writeFile(recapPath, Buffer.from(recapDoc.output('arraybuffer')));

    // 5. Generate .filien Flat File (Official Format)
    const filienParams = {
      orga: appSettings?.filienOrga || '01',
      budget: appSettings?.filienBudget || 'BA',
      exercice: appSettings?.filienExercice || year,
      avancement: appSettings?.filienAvancement || '5',
      rejetDispo: appSettings?.filienRejetDispo ?? true,
      rejetCA: appSettings?.filienRejetCA ?? false,
      rejetMarche: appSettings?.filienRejetMarche ?? false,
      filienChapitre: appSettings?.filienChapitre || '',
      filienNature: appSettings?.filienNature || '',
      filienFonction: appSettings?.filienFonction || '',
      filienCodeInterne: appSettings?.filienCodeInterne || '',
      filienTypeMouvement: appSettings?.filienTypeMouvement || '',
      filienSens: appSettings?.filienSens || '',
      filienStructure: appSettings?.filienStructure || '',
      filienGestionnaire: appSettings?.filienGestionnaire || '',
    };

    const { prepareFilienMovements, exportToUnc, generateFilienFile } = require('@/lib/billing-service');
    
    // runName will be the subfolder name (already defined above)
    const movements = prepareFilienMovements(results, dossiers, appSettings, tlpeConfig, year, runName);

    const filienContent = generateFilienFile(filienParams, movements);
    const filienFilename = `FACT-${timestampStr}.filien`;
    const filienPath = join(facturesDir, filienFilename);
    await writeFile(filienPath, filienContent);

    // 6. Optional: Copy to UNC path if configured
    if (appSettings?.filienUncPj) {
      await exportToUnc({
        uncDir: appSettings.filienUncPj,
        runName,
        filienContent,
        filienFilename,
        results,
        tlpeConfig,
        recapFilename,
        recapPath,
        facturesDir,
        appSettings // Pass appSettings here
      });
    }

    // 7. Record run in DB for history and deletion support
    try {
      await (prisma as any).billingRun.create({
        data: {
          id: `FACT-${timestampStr}`,
          type: type || 'Facturation',
          date: now,
          count: results.length,
          total: grandTotal,
          agent: agentName,
          recapPath: `/Factures/${runName}/${recapFilename}`,
          filienPath: `/Factures/${runName}/${filienFilename}`,
          invoices: {
            create: results.map(r => ({
              dossierId: r.id,
              numero: r.numero,
              tiers: r.tiers,
              total: r.total,
              pdfPath: r.path
            }))
          }
        }
      });
    } catch (dbErr) {
      console.error('[DB RECORD ERROR]', dbErr);
      // Don't fail the whole process if DB recording fails
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      total: grandTotal,
      recapPdf: `/Factures/${runName}/${recapFilename}`,
      filienPath: `/Factures/${runName}/${filienFilename}`,
      invoices: results.map((r: any) => ({ id: r.id, numero: r.numero, path: r.path, tiers: r.tiers }))
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
