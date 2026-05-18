import { prisma } from './prisma';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function calculateMonthlyProrata(startDate: Date, endDate: Date): { months: number; ratio: number } {
  let fullStartDate = new Date(startDate);
  if (fullStartDate.getDate() !== 1) {
    fullStartDate = new Date(fullStartDate.getFullYear(), fullStartDate.getMonth() + 1, 1);
  }

  let fullEndDate = new Date(endDate);
  if (fullEndDate.getDate() !== getDaysInMonth(fullEndDate)) {
    fullEndDate = new Date(fullEndDate.getFullYear(), fullEndDate.getMonth(), 0);
  }

  if (fullEndDate < fullStartDate) return { months: 0, ratio: 0 };

  const months = (fullEndDate.getFullYear() - fullStartDate.getFullYear()) * 12
                 + (fullEndDate.getMonth() - fullStartDate.getMonth()) + 1;

  return { months, ratio: months / 12 };
}

export async function generateInvoicePdfBuffer(
  occupationId: number | null, 
  overrides?: { 
    invoiceNumber?: string; 
    tlpeConfig?: any; 
    tiersId?: number; 
    annee?: number;
    occupationIds?: number[];
    forceRed?: boolean;
  }
): Promise<{ buffer: Buffer; filename: string }> {
  // 1. Fetch data
  let occ: any = null;
  let allLignes: any[] = [];
  let facturableId: number;
  let allOccIds: number[] = [];

  if (occupationId) {
    occ = await prisma.occupation.findUnique({
      where: { id: occupationId },
      include: {
        tiers: true,
        lignes: { include: { article: { include: { modeTaxation: true } } } }
      }
    });
    if (!occ) throw new Error('Occupation non trouvée');
    allLignes = occ.lignes || [];
    facturableId = occ.tiersId;
    allOccIds = [occ.id];
  } else if (overrides?.occupationIds && overrides.occupationIds.length > 0) {
    const occs = await prisma.occupation.findMany({
      where: { id: { in: overrides.occupationIds } },
      include: {
        tiers: true,
        lignes: { include: { article: { include: { modeTaxation: true } } } }
      }
    });
    if (occs.length === 0) throw new Error('Aucune occupation trouvée');
    
    occ = occs[0];
    allLignes = occs.flatMap(o => o.lignes || []);
    occ.lignes = allLignes;
    facturableId = occ.tiersId;
    allOccIds = occs.map(o => o.id);
  } else if (overrides?.tiersId && overrides?.annee) {
    const occs = await prisma.occupation.findMany({
      where: { tiersId: overrides.tiersId, anneeTaxation: overrides.annee },
      include: {
        tiers: true,
        lignes: { include: { article: { include: { modeTaxation: true } } } }
      }
    });
    if (occs.length === 0) throw new Error('Aucune occupation trouvée pour cette année');
    
    // On utilise la première comme base pour le type et les paramètres
    occ = occs[0];
    // On regroupe toutes les lignes de tous les dispositifs
    allLignes = occs.flatMap(o => o.lignes || []);
    occ.lignes = allLignes; // On écrase pour le reste de la logique
    facturableId = overrides.tiersId;
    allOccIds = occs.map(o => o.id);
  } else {
    throw new Error('Paramètres manquants');
  }

  const settings = await (prisma as any).appSettings.findFirst();

  // Add surcharge line if occupation is not authorized (non autorisé)
  if (occ.isNotAuthorized) {
    const totalBase = (occ.lignes || [])
      .filter((l: any) => !l.deletedAt)
      .reduce((sum: number, l: any) => sum + (l.montant || 0), 0);

    if (totalBase > 0) {
      const surcharge = {
        id: 999999, // Dummy ID for template rendering
        occupationId: occ.id,
        articleId: 0,
        article: {
          id: 0,
          designation: 'Majoration dossier non autorisé',
          montant: totalBase,
          modeTaxation: null
        },
        quantite1: 1,
        quantite2: 1,
        montant: totalBase,
        dateDebut: occ.dateDebut,
        dateFin: occ.dateFin,
        dateDebutConstatee: occ.dateDebut,
        dateFinConstatee: occ.dateFin,
        photos: '',
        note: 'Majoration appliquée car le dossier n\'a pas l\'autorisation requise',
        deletedAt: null
      };
      occ.lignes.push(surcharge);
    }
  }

  // Add minoration line if occupation is court métrage TOURNAGE
  if (occ.type === 'TOURNAGE' && (occ as any).isCourtMetrage) {
    const totalBase = (occ.lignes || [])
      .filter((l: any) => !l.deletedAt)
      .reduce((sum: number, l: any) => sum + (l.montant || 0), 0);

    if (totalBase > 0) {
      const minoration = {
        id: 999998, // Dummy ID for template rendering
        occupationId: occ.id,
        articleId: 0,
        article: {
          id: 0,
          designation: 'Minoration court métrage',
          montant: totalBase * 0.5,
          modeTaxation: null
        },
        quantite1: 1,
        quantite2: 1,
        montant: -(totalBase * 0.5),
        dateDebut: occ.dateDebut,
        dateFin: occ.dateFin,
        dateDebutConstatee: occ.dateDebut,
        dateFinConstatee: occ.dateFin,
        photos: '',
        note: 'Minoration de 50% appliquée pour tournage court métrage',
        deletedAt: null
      };
      occ.lignes.push(minoration);
    }
  }

  // Get the billing tiers: use "Agissant pour" if isAgissantPourBillable is true, otherwise use "Demandeur"
  let tierFacturable = occ.tiers;
  let tierAgissantPour = null;
  if (occ.agissantPour) {
    const tierAgissantPourId = parseInt(occ.agissantPour);
    if (!isNaN(tierAgissantPourId)) {
      tierAgissantPour = await prisma.tiers.findUnique({
        where: { id: tierAgissantPourId }
      });
      // Only use agissantPour as billable tiers if isAgissantPourBillable is true
      if ((occ as any).isAgissantPourBillable && tierAgissantPour) {
        tierFacturable = tierAgissantPour;
      }
    }
  }

  // Load TypeDossierConfig for the specific type
  const typeConfig = await (prisma as any).typeDossierConfig.findUnique({
    where: { type: occ.type }
  });

  let gabarit;
  if (typeConfig && typeConfig.invoiceTemplateId) {
    gabarit = await (prisma as any).gabarit.findUnique({
      where: { id: parseInt(typeConfig.invoiceTemplateId) }
    });
  }

  // Fallback to default if not found or not specified
  if (!gabarit) {
    gabarit = await (prisma as any).gabarit.findFirst({
      where: { isDefault: true }
    });
  }
  
  if (!gabarit) throw new Error('Aucun gabarit défini');

  const taxYear = (occ as any).anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear());
  
  let tlpeConfig = overrides?.tlpeConfig || null;
  if (!tlpeConfig && occ.type === 'TLPE') {
    tlpeConfig = await (prisma as any).tlpeConfig.findUnique({
      where: { annee: taxYear }
    });
  }

  const { elements } = JSON.parse(gabarit.contenu);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const watermark = (settings as any)?.watermark || 'BROUILLON';

  const currentInvoiceNumber = overrides?.invoiceNumber || (occ as any).numeroFacture;

  // Add watermark in background if not a final invoice
  if (!currentInvoiceNumber) {
    const pageWidth = (doc as any).internal.pageSize.getWidth();
    const pageHeight = (doc as any).internal.pageSize.getHeight();

    doc.setTextColor(220, 220, 220);
    doc.setFontSize(70);
    doc.setFont('helvetica', 'bold');

    doc.text(watermark.toUpperCase(), pageWidth / 2, (pageHeight * 2) / 3 + 141.75, {
      align: 'center',
      baseline: 'middle',
      angle: 45
    });
  }

  const processConditionals = (xml: string, variables: Record<string, string>): string => {
    let result = xml;
    const ifRegex = /\{IF\s+(\w+(?:\.\w+)*)\|/g;
    const matches: Array<{ index: number; length: number; variableKey: string; conditionalText: string }> = [];

    let match;
    while ((match = ifRegex.exec(xml)) !== null) {
      const startIndex = match.index;
      const variableKey = match[1];
      const textStartIndex = match.index + match[0].length;

      let braceCount = 1;
      let endIndex = textStartIndex;
      while (endIndex < xml.length && braceCount > 0) {
        if (xml[endIndex] === '{') braceCount++;
        if (xml[endIndex] === '}') braceCount--;
        endIndex++;
      }

      const conditionalText = xml.substring(textStartIndex, endIndex - 1);
      matches.push({
        index: startIndex,
        length: endIndex - startIndex,
        variableKey,
        conditionalText,
      });
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const variableValue = variables[`{${m.variableKey}}`];
      const replacement = variableValue && variableValue.trim() !== '' ? m.conditionalText : '';
      result = result.substring(0, m.index) + replacement + result.substring(m.index + m.length);
    }

    return result;
  };

  const replaceVars = (val: string, ligne?: any) => {
      if (!val) return val;
      let result = val;

      const threshold = tlpeConfig?.exoneration ?? 12;
      const totalEnseigneSurface = (occ.lignes || [])
        .filter((l: any) => !l.deletedAt)
        .reduce((sum: number, l: any) => {
          let mt: any = {};
          try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
          if (mt.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
          return sum;
      }, 0) || 0;
      const isEnseigneExempt = totalEnseigneSurface <= threshold;

      let totalSum = (occ.lignes || [])
        .filter((l: any) => !l.deletedAt && l.id !== 999998 && l.id !== 999999)
        .reduce((sum: number, l: any) => {
          let mt: any = {};
          try { mt = l.article?.notes ? JSON.parse(l.article.notes) : {}; } catch(e){}
          if (occ.type === 'TLPE') {
              if (mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt) return sum;
              const d1 = new Date(l.dateDebut);
              const d2 = new Date(l.dateFin);
              const { ratio: prorata } = calculateMonthlyProrata(d1, d2);
              return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
          }
          // Use l.montant which is already calculated with quantite1 * quantite2 in the database
          return sum + (l.montant || 0);
      }, 0) || 0;

      // Apply court métrage discount for TOURNAGE type (only if not already applied to individual articles)
      if (occ.type === 'TOURNAGE' && (occ as any).isCourtMetrage) {
        totalSum = totalSum * 0.5;
      }

      const replacements: Record<string, string> = {
        'Détail de facture': `Détail de facture (${taxYear})`,
        '{id}': occ.id.toString(),
        '{nom}': occ.nom || '',
        '{tiers.nom}': occ.tiers?.nom || '',
        '{tiers.adresse}': (occ.tiers?.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
        '{adresse}': (occ.adresse && occ.adresse !== 'À renseigner' ? occ.adresse : (occ.tiers?.adresse || '')).replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
        '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
        '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
        '{numeroFacture}': currentInvoiceNumber || watermark,
        '{periode}': taxYear.toString(),
        '{totalTTC}': `${totalSum.toFixed(2)} €`,
        '{today}': format(new Date(), 'dd/MM/yyyy'),
        '{v12}': (settings as any)?.filienPoste || '',
        '{v13}': (settings as any)?.filienBordereau || '',
        '{v20}': (settings as any)?.filienObjet || '',
        '{v541.chapitre}': (settings as any)?.filienChapitre || '',
        '{v541.nature}': (settings as any)?.filienNature || '',
        '{v541.fonction}': (settings as any)?.filienFonction || '',
        '{v541.typeMvmt}': (settings as any)?.filienTypeMouvement || '',
        '{demandeurComplet}': occ.tiers?.nom || '',
        '{agissantPourTier.nom}': tierAgissantPour?.nom || '',
        '{agissantPourTier.adresse}': (tierAgissantPour?.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
        '{tierFacturable.nom}': tierFacturable?.nom || '',
        '{tierFacturable.adresse}': (tierFacturable?.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
        '{tierFacturable.siret}': (tierFacturable as any)?.siret || '',
        '{tierFacturable.email}': (tierFacturable as any)?.email || ''
      };

      if (ligne && ligne.article) {
        let mt: any = {};
        try { mt = ligne.article.notes ? JSON.parse(ligne.article.notes) : {}; } catch(e){}

        const isDegrèvement = ligne.article.designation === 'DEGRÈVEMENT';

        const d1 = new Date(ligne.dateDebutConstatee || ligne.dateDebut);
        const d2 = new Date(ligne.dateFinConstatee || ligne.dateFin);
        const dateStr = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;

        const occD1 = occ.dateDebut ? new Date(occ.dateDebut) : null;
        const occD2 = occ.dateFin ? new Date(occ.dateFin) : null;

        const isDifferentDates = !occD1 || !occD2 ||
          format(d1, 'yyyy-MM-dd') !== format(occD1, 'yyyy-MM-dd') ||
          format(d2, 'yyyy-MM-dd') !== format(occD2, 'yyyy-MM-dd');

        replacements['{article.designation}'] = ligne.article.designation || '';
        replacements['{article.designationcomplete}'] = isDegrèvement
          ? (ligne.article.designation || '')
          : (isDifferentDates
            ? `${ligne.article.designation || ''} du ${dateStr}`
            : (ligne.article.designation || ''));
        replacements['{article.note}'] = ligne.note || '';

        const modeNom = (ligne.article.modeTaxation?.nom || 'unité').toLowerCase();
        const modeParts = (ligne.article.modeTaxation?.nom || 'unité').split('/').filter(Boolean).map((p: string) => p.trim());

        const u1 = modeParts[0] || 'unités';
        const u2 = modeParts[1] || '';

        // Pour TLPE, afficher uniquement la surface en m²
        let qteFull = occ.type === 'TLPE'
          ? `${ligne.quantite1 || 0} m²`
          : (occ.type === 'CHANTIER' || occ.type === 'TOURNAGE')
            ? `${ligne.quantite1 || 0} ${u1}${u2 ? ` × ${ligne.quantite2 || 0} ${u2}` : ''}`
            : `${ligne.quantite1 || 0} ${u1}`;

        replacements['{article.quantite}'] = isDegrèvement ? '' : qteFull;
        replacements['{article.dates}'] = isDegrèvement ? '' : dateStr;

        const pu = occ.type === 'TLPE' ? (ligne.montant || 0) : (ligne.article.montant || 0);
        let lineVal = (ligne.montant || 0);
        let details = '';

        if (isDegrèvement) {
          // For reductions, display the deducted amount
          lineVal = ligne.montant || 0;
          const deductedAmount = Math.abs(lineVal);
          details = `Déduction : ${deductedAmount.toFixed(2)}€`;
          replacements['{article.pu}'] = `${deductedAmount.toFixed(2)} €`;
          replacements['{article.totalHT}'] = `-${deductedAmount.toFixed(2)} €`;
          replacements['{article.full_description}'] = `${ligne.article.designation}\n${details}`;
        } else if (occ.type === 'TLPE') {
          const { months, ratio: prorata } = calculateMonthlyProrata(d1, d2);
          const isExempt = mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt;
          lineVal = isExempt ? 0 : (pu * (ligne.quantite1 || 0) * prorata);
          details = `${ligne.quantite1} m² à ${pu.toFixed(2)}€/m²${prorata < 1 ? ` (${months} mois)` : ''}${isExempt ? ' (Exonéré)' : ''}`;
          replacements['{article.pu}'] = `${pu.toFixed(2)} €`;
          replacements['{article.totalHT}'] = `${lineVal.toFixed(2)} €`;
          replacements['{article.full_description}'] = `${ligne.article.designation}\n${dateStr}\n${details}`;
        } else {
          // Use ligne.montant which is already calculated with quantite1 * quantite2
          lineVal = ligne.montant || 0;
          details = u2
            ? `${ligne.quantite1} ${u1} × ${ligne.quantite2 || 0} ${u2} à ${pu.toFixed(2)}€`
            : `${ligne.quantite1} ${u1} à ${pu.toFixed(2)}€`;
          replacements['{article.pu}'] = `${pu.toFixed(2)} €`;
          replacements['{article.totalHT}'] = `${lineVal.toFixed(2)} €`;
          replacements['{article.full_description}'] = `${ligne.article.designation}\n${dateStr}\n${details}`;
        }
        replacements['{article.details}'] = details;
      }

      // Process conditionals first (e.g., {IF agissantPourTier.nom|text})
      result = processConditionals(result, replacements);

      // Then replace variables
      Object.entries(replacements).sort((a,b) => b[0].length - a[0].length).forEach(([k, v]) => {
        result = result.split(k).join(v);
      });
      return result;
  };

  for (const el of (elements as any[])) {
      const style = el.style || {};
      const isRepeated = typeof el.value === 'string' && el.value.includes('{article.');
      const instances = (isRepeated && occ.lignes) ? occ.lignes.filter((l: any) => !l.deletedAt && l.montant !== 0) : [null];
      for (let i = 0; i < instances.length; i++) {
          const y = el.y + (i * (el.verticalPitch || (isRepeated ? 25 : 30)));
          if (el.type === 'RECT' && !style.noBackground && style.backgroundColor && style.backgroundColor !== 'transparent') {
              doc.setFillColor(style.backgroundColor);
              doc.rect(el.x, y, el.width, el.height, 'F');
          } else if (el.type === 'TEXT' || el.type === 'VARIABLE') {
              const text = replaceVars(el.value, instances[i]);
              if (text) {
                const fontSize = style.fontSize || 12;
                doc.setFontSize(fontSize);
                
                // Si forceRed est activé et que c'est le titre du document
                if (overrides?.forceRed && (el.value === 'Détail de facture' || el.value?.includes('Détail de facture'))) {
                  doc.setTextColor(255, 0, 0);
                } else {
                  doc.setTextColor(style.color || '#000000');
                }
                
                const isItalic = style.italic || style.fontStyle === 'italic';
                const weight = (style.fontWeight === 'bold' || style.fontWeight === 'black' || style.fontWeight >= 700) ? 'bold' : 'normal';
                let fontStyle = weight;
                if (isItalic && weight === 'bold') fontStyle = 'bolditalic';
                else if (isItalic) fontStyle = 'italic';
                
                let family = 'helvetica';
                if (style.fontFamily?.includes('Times')) family = 'times';
                else if (style.fontFamily?.includes('Courier')) family = 'courier';
                doc.setFont(family, fontStyle);

                const lines = text.split('\n');
                let currentY = y + fontSize;
                
                lines.forEach((line: string) => {
                  const splitLine = doc.splitTextToSize(line, el.width);
                  const options: any = { align: 'left' };
                  let targetX = el.x;

                  if (style.textAlign === 'center') {
                    targetX = el.x + el.width / 2;
                    options.align = 'center';
                  } else if (style.textAlign === 'right') {
                    targetX = el.x + el.width;
                    options.align = 'right';
                  }

                  doc.text(splitLine, targetX, currentY, options);
                  currentY += (splitLine.length * fontSize * 1.2);
                });
              }
          } else if (el.type === 'IMAGE' && el.value) {
              try {
                  let data = el.value;
                  if (el.value.startsWith('/')) {
                      const buffer = await readFile(join(process.cwd(), 'public', el.value));
                      data = `data:image/${el.value.endsWith('.png') ? 'png' : 'jpeg'};base64,${buffer.toString('base64')}`;
                  }
                  doc.addImage(data, el.value.toLowerCase().includes('.png') ? 'PNG' : 'JPEG', el.x, y, el.width, el.height);
              } catch (e) {}
          }
      }
  }

  const output = doc.output('arraybuffer');
  const buffer = Buffer.from(output);
  const filename = occupationId ? `Facture-${occ.id}.pdf` : `Facture-Commerce-${overrides?.tiersId}-${overrides?.annee}.pdf`;

  // Save to disk as cache
  try {
      const outDir = join(process.cwd(), 'public', 'uploads', 'factures');
      if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
      const outPath = join(outDir, filename);
      await writeFile(outPath, buffer);
      
      if (occupationId) {
          await prisma.occupation.update({ where: { id: occ.id }, data: { facturePath: `/uploads/factures/${filename}` } });
      } else if (allOccIds.length > 0) {
          await prisma.occupation.updateMany({
              where: { id: { in: allOccIds } },
              data: { facturePath: `/uploads/factures/${filename}` }
          });
      }
  } catch (e) {}

  return { buffer, filename };
}
