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
  occupationId: number, 
  overrides?: { invoiceNumber?: string; tlpeConfig?: any }
): Promise<{ buffer: Buffer; filename: string }> {
  // 1. Fetch data
  const [occ, settings] = await Promise.all([
    prisma.occupation.findUnique({
      where: { id: occupationId },
      include: {
        tiers: true,
        lignes: { include: { article: { include: { modeTaxation: true } } } }
      }
    }),
    prisma.appSettings.findFirst()
  ]);

  if (!occ) throw new Error('Occupation non trouvée');

  // Get the billing tiers: use "Agissant pour" if defined, otherwise use "Demandeur"
  let tierFacturable = occ.tiers;
  if (occ.agissantPour) {
    const tierAgissantPourId = parseInt(occ.agissantPour);
    if (!isNaN(tierAgissantPourId)) {
      tierFacturable = await prisma.tiers.findUnique({
        where: { id: tierAgissantPourId }
      }) || occ.tiers;
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
    const records = await prisma.$queryRaw`SELECT * FROM TlpeConfig WHERE annee = ${taxYear}` as any[];
    tlpeConfig = records[0] || null;
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

  const replaceVars = (val: string, ligne?: any) => {
      if (!val) return val;
      let result = val;
      
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
              const { ratio: prorata } = calculateMonthlyProrata(d1, d2);
              return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
          }
          return sum + (l.montant || 0);
      }, 0) || 0;

      const replacements: Record<string, string> = {
        '{id}': occ.id.toString(),
        '{nom}': occ.nom || '',
        '{tiers.nom}': tierFacturable?.nom || '',
        '{adresse}': (occ.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
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
        '{v541.typeMvmt}': (settings as any)?.filienTypeMouvement || ''
      };

      if (ligne && ligne.article) {
        let mt: any = {};
        try { mt = ligne.article.notes ? JSON.parse(ligne.article.notes) : {}; } catch(e){}
        
        const d1 = new Date(ligne.dateDebutConstatee || ligne.dateDebut);
        const d2 = new Date(ligne.dateFinConstatee || ligne.dateFin);
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
        
        const modeNom = (ligne.article.modeTaxation?.nom || 'unité').toLowerCase();
        const modeParts = (ligne.article.modeTaxation?.nom || 'unité').split('/');
        
        let unit = modeParts[1] || modeParts[0] || '';
        let timeUnit = modeParts[2] || (modeNom.includes('jour') ? 'jours' : 'mois');

        // Si l'unité extraite est en fait l'unité de temps (ex: Benne/jour)
        if (modeParts.length === 2 && (unit.toLowerCase().includes('jour') || unit.toLowerCase().includes('mois'))) {
          unit = 'unité';
        }

        // Pour TLPE, afficher uniquement la surface en m²
        let qteFull = occ.type === 'TLPE'
          ? `${ligne.quantite1 || 0} m²`
          : `${ligne.quantite1 || 0} ${unit}`;
        if (occ.type !== 'TLPE' && ligne.quantite2 > 0) {
          qteFull += ` x ${ligne.quantite2} ${timeUnit}`;
        }
        replacements['{article.quantite}'] = qteFull;
        replacements['{article.dates}'] = dateStr;
        
        const pu = occ.type === 'TLPE' ? (ligne.montant || 0) : (ligne.article.montant || 0);
        let lineVal = (ligne.montant || 0);
        let details = '';

        if (occ.type === 'TLPE') {
          const { months, ratio: prorata } = calculateMonthlyProrata(d1, d2);
          const isExempt = mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt;
          lineVal = isExempt ? 0 : (pu * (ligne.quantite1 || 0) * prorata);
          details = `${ligne.quantite1} m² à ${pu.toFixed(2)}€/m²${prorata < 1 ? ` (${months} mois)` : ''}${isExempt ? ' (Exonéré)' : ''}`;
        } else {
          details = `${ligne.quantite1} ${unit}`;
          if (ligne.quantite2 > 0) {
            details += ` x ${ligne.quantite2} ${timeUnit}`;
          }
          details += ` à ${pu.toFixed(2)}€`;
        }
        replacements['{article.details}'] = details;
        replacements['{article.pu}'] = `${pu.toFixed(2)} €`;
        replacements['{article.totalHT}'] = `${lineVal.toFixed(2)} €`;
        replacements['{article.full_description}'] = `${ligne.article.designation}\n${dateStr}\n${details}`;
      }

      Object.entries(replacements).sort((a,b) => b[0].length - a[0].length).forEach(([k, v]) => {
        result = result.split(k).join(v);
      });
      return result;
  };

  for (const el of (elements as any[])) {
      const style = el.style || {};
      const isRepeated = typeof el.value === 'string' && el.value.includes('{article.');
      const instances = (isRepeated && occ.lignes) ? occ.lignes : [null];
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
                doc.setTextColor(style.color || '#000000');
                
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
  const filename = `Facture-${occ.id}.pdf`;

  // Save to disk as cache
  try {
      const outDir = join(process.cwd(), 'public', 'uploads', 'factures');
      if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
      const outPath = join(outDir, filename);
      await writeFile(outPath, buffer);
      await prisma.occupation.update({ where: { id: occ.id }, data: { facturePath: `/uploads/factures/${filename}` } });
  } catch (e) {}

  return { buffer, filename };
}
