import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import { format, differenceInDays, isLeapYear } from 'date-fns';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/** 
 * PDF Generation Route for TLPE and ODP Folders
 * Using $queryRaw for TlpeConfig to bypass Prisma Client limitations.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    
    // 1. Fetch data
    const [occ, settings] = await Promise.all([
      prisma.occupation.findUnique({
        where: { id },
        include: {
          tiers: true,
          lignes: { include: { article: { include: { modeTaxation: true } } } }
        }
      }),
      prisma.appSettings.findFirst()
    ]);

    if (!occ) return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });

    // Get the billing tiers: use "Agissant pour" if defined, otherwise use "Demandeur"
    let tierFacturable = occ.tiers;
    if (occ.agissantPour) {
      // agissantPour stores the ID of the tier
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
    
    if (!gabarit) return NextResponse.json({ error: 'Aucun gabarit défini' }, { status: 500 });

    const taxYear = (occ as any).anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear());
    
    // Safer TlpeConfig fetch using $queryRaw as done in other routes
    let tlpeConfig = null;
    if (occ.type === 'TLPE') {
      const records = await prisma.$queryRaw`SELECT * FROM TlpeConfig WHERE annee = ${taxYear}` as any[];
      tlpeConfig = records[0] || null;
    }

    const { elements } = JSON.parse(gabarit.contenu);
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const watermark = (settings as any)?.watermark || 'BROUILLON';

    const fromBuffer = (ab: ArrayBuffer) => {
      const buf = Buffer.alloc(ab.byteLength);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buf.length; ++i) buf[i] = view[i];
      return buf;
    };

    // Add watermark in background if not a final invoice
    if (!occ.numeroFacture) {
      const pageWidth = (doc as any).internal.pageSize.getWidth();
      const pageHeight = (doc as any).internal.pageSize.getHeight();

      doc.setTextColor(220, 220, 220);
      doc.setFontSize(70);
      doc.setFont(undefined, 'bold');

      doc.text(watermark.toUpperCase(), pageWidth / 2, (pageHeight * 2) / 3, {
        align: 'center',
        baseline: 'middle',
        angle: 45
      });
    }

    const replaceVars = (val: string, ligne?: any) => {
        if (!val) return val;
        let result = val;
        
        const threshold = tlpeConfig?.exoneration ?? 12; // Fallback to 12 as per schema
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
          '{numeroFacture}': (occ as any).numeroFacture || watermark,
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
          replacements['{article.designation}'] = ligne.article.designation || '';
          replacements['{article.quantite}'] = (ligne.quantite1 || 0).toString();
          const d1 = new Date(ligne.dateDebut);
          const d2 = new Date(ligne.dateFin);
          replacements['{article.dates}'] = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
          
          const pu = occ.type === 'TLPE' ? (ligne.montant || 0) : (ligne.article.montant || 0);
          let lineVal = pu * (ligne.quantite1 || 0);
          let details = '';

          if (occ.type === 'TLPE') {
            const year = (occ as any).anneeTaxation || d1.getFullYear();
            const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
            const daysActive = differenceInDays(d2, d1) + 1;
            const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
            const isExempt = mt.tlpeType === 'ENSEIGNE' && isEnseigneExempt;
            lineVal = isExempt ? 0 : (pu * (ligne.quantite1 || 0) * prorata);
            details = `${ligne.quantite1} m² à ${pu.toFixed(2)}€/m²${prorata < 1 ? ` (${daysActive}j)` : ''}${isExempt ? ' (Exonéré)' : ''} soit ${lineVal.toFixed(2)} €`;
          } else {
            details = `${ligne.quantite1} unité(s) à ${pu.toFixed(2)}€ soit ${(ligne.montant || 0).toFixed(2)} €`;
          }
          replacements['{article.details}'] = details;
          replacements['{article.pu}'] = `${pu.toFixed(2)} €`;
          replacements['{article.totalHT}'] = `${lineVal.toFixed(2)} €`;
          replacements['{article.full_description}'] = `${ligne.article.designation}\n${replacements['{article.dates}']}\n${details}`;
        }

        Object.entries(replacements).sort((a,b) => b[0].length - a[0].length).forEach(([k, v]) => {
          result = result.split(k).join(v);
        });
        return result;
    };

    // 2. Render elements
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
                  doc.setFontSize(style.fontSize || 12);
                  doc.setTextColor(style.color || '#000000');
                  doc.text(doc.splitTextToSize(text, el.width), el.x, y + (style.fontSize || 12));
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
    const buf = fromBuffer(output);

    try {
        const outDir = join(process.cwd(), 'public', 'uploads', 'factures');
        if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
        const outPath = join(outDir, `Facture-${occ.id}.pdf`);
        await writeFile(outPath, buf);
        await prisma.occupation.update({ where: { id: occ.id }, data: { facturePath: `/uploads/factures/Facture-${occ.id}.pdf` } });
    } catch (e) {}

    return new Response(output, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Facture-${occ.id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[PDF ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
