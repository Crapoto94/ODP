import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import jsPDF from 'jspdf';
import { format, differenceInDays, isLeapYear } from 'date-fns';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';
import { sendApmMail } from '@/lib/apm';
import { generateBillingNotificationEmail } from '@/lib/billing-email-templates';
import { generateSeditValidationToken } from '@/lib/sedit-validation-token';

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
      const { buffer: pdfBuffer } = await generateInvoicePdfBuffer(occ.id, { invoiceNumber, tlpeConfig });
      
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
    const billingRunId = `FACT-${timestampStr}`;
    try {
      await (prisma as any).billingRun.create({
        data: {
          id: billingRunId,
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

    // 8. Send notification email to finance team
    try {
      if (appSettings?.financeEmail) {
        // Get agent email from session user
        let agentEmail = '';
        if (session?.id) {
          const agentUser = await (prisma as any).$queryRaw`SELECT email FROM "User" WHERE id = ${session.id} LIMIT 1`;
          if (agentUser && (agentUser as any[]).length > 0) {
            agentEmail = (agentUser as any[])[0].email;
          }
        }

        // Count dossiers by type
        const dossiersByType: Record<string, number> = {};
        dossiers.forEach((d: any) => {
          const docType = d.type || 'INCONNU';
          dossiersByType[docType] = (dossiersByType[docType] || 0) + 1;
        });

        // Generate SEDIT validation token
        const validationToken = await generateSeditValidationToken(
          billingRunId,
          agentEmail,
          agentName,
          results.length
        );

        const validationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/facturation/sedit-validation?token=${encodeURIComponent(validationToken)}`;

        const notificationEmail = generateBillingNotificationEmail({
          financeEmail: appSettings.financeEmail,
          billingRunId,
          dossiersCount: results.length,
          dossierTypes: dossiersByType,
          agentName,
          timestamp: format(now, 'dd/MM/yyyy HH:mm'),
          validationLink,
        });

        await sendApmMail(
          appSettings.financeEmail,
          `[ODP] Nouveau train de facturation prêt - ${billingRunId}`,
          notificationEmail,
          'ODP Console'
        );
      }
    } catch (mailErr) {
      console.error('[BILLING NOTIFICATION EMAIL ERROR]', mailErr);
      // Don't fail the whole process if email fails
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      total: grandTotal,
      recapPdf: `/Factures/${runName}/${recapFilename}`,
      filienPath: `/Factures/${runName}/${filienFilename}`,
      billingRunId,
      invoices: results.map((r: any) => ({ id: r.id, numero: r.numero, path: r.path, tiers: r.tiers }))
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
