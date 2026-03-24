import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    
    // 1. Fetch data
    const [occ, gabarit, settings] = await Promise.all([
      prisma.occupation.findUnique({
        where: { id },
        include: { 
          tiers: true,
          lignes: { include: { article: true } }
        }
      }),
      (prisma as any).gabarit.findFirst({
        where: { isDefault: true }
      }),
      prisma.appSettings.findFirst()
    ]);

    if (!occ) {
      return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });
    }

    if (!gabarit) {
      return NextResponse.json({ error: 'Aucun gabarit par défaut défini' }, { status: 500 });
    }

    const { elements } = JSON.parse(gabarit.contenu);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    // Watermark "BROUILLON" since it's an individual dossier generation
    if (!(occ as any).numeroFacture) {
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(100);
        doc.text("BROUILLON", 100, 650, { angle: 45 });
    }

    // Helper to replace variables (global and article-specific)
    const replaceVars = (val: string, ligne?: any) => {
        if (!val) return val;
        let result = val;
        const totalSum = occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || 0;

        const TYPE_MAP: Record<string, string> = {
          'COMMERCE': 'Commerce',
          'CHANTIER': 'Chantier',
          'TOURNAGE': 'Tournage',
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
          '{tiers.nom}': occ.tiers.nom || '',
          '{adresse}': formatAddress(occ.adresse || ''),
          '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
          '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
          '{numeroFacture}': (occ as any).numeroFacture || 'Brouillon',
          '{periode}': (occ as any).anneeTaxation ? (occ as any).anneeTaxation.toString() : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear().toString() : new Date().getFullYear().toString()),
          '{totalTTC}': `${totalSum.toFixed(2)} €`,
          '{totalHT}': `${totalSum.toFixed(2)} €`,
          '{today}': format(new Date(), 'dd/MM/yyyy'),
          // Analytical / Filien globals (fallback to AppSettings)
          '{v12}': (settings as any)?.filienPoste || '',
          '{v13}': (settings as any)?.filienBordereau || '',
          '{v20}': (settings as any)?.filienObjet || '',
          '{v541.chapitre}': (settings as any)?.filienChapitre || '',
          '{v541.nature}': (settings as any)?.filienNature || '',
          '{v541.fonction}': (settings as any)?.filienFonction || '',
          '{v541.codeInterne}': (settings as any)?.filienCodeInterne || '',
          '{v541.typeMvmt}': (settings as any)?.filienTypeMouvement || '',
          '{v541.sens}': (settings as any)?.filienSens || '',
          '{v542.structure}': (settings as any)?.filienStructure || '',
          '{v542.gestionnaire}': (settings as any)?.filienGestionnaire || ''
        };

        if (ligne && ligne.article) {
          replacements['{article.designation}'] = ligne.article.designation || '';
          replacements['{article.quantite}'] = (ligne.quantite1 || 0).toString();
          replacements['{article.pu}'] = `${(ligne.article.montant || 0).toFixed(2)} €`;
          replacements['{article.totalHT}'] = `${(ligne.montant || 0).toFixed(2)} €`;
          
          // New Precise Variables
          const dateS = ligne.dateDebutConstatee || ligne.dateDebut;
          const dateE = ligne.dateFinConstatee || ligne.dateFin;
          const dS = dateS ? format(new Date(dateS), 'dd/MM/yyyy') : '';
          const dE = dateE ? format(new Date(dateE), 'dd/MM/yyyy') : '';
          replacements['{article.dates}'] = dS && dE ? `${dS} - ${dE}` : (dS || dE || '');
          
          const u1 = (ligne.article.modeTaxation?.nom || 'unité').split('/')[1] || 'unité';
          const u2 = (ligne.article.modeTaxation?.nom || 'unité').split('/')[2] || (ligne.article.modeTaxation?.nom?.includes('jour') ? 'jours' : 'mois');
          
          let detailStr = `${ligne.quantite1} ${u1}`;
          if (ligne.quantite2 > 1) detailStr += ` x ${ligne.quantite2} ${u2}`;
          detailStr += ` à ${(ligne.article.montant || 0).toFixed(2)}€ soit ${(ligne.montant || 0).toFixed(2)} €`;
          replacements['{article.details}'] = detailStr;

          replacements['{article.full_description}'] = `${ligne.article.designation}\n${replacements['{article.dates}']}\n${detailStr}`;
          
          // Allow article to override analytical fields if they were defined on the article level
          if (ligne.article.chapitre) replacements['{v541.chapitre}'] = ligne.article.chapitre;
          if (ligne.article.nature) replacements['{v541.nature}'] = ligne.article.nature;
          if (ligne.article.fonction) replacements['{v541.fonction}'] = ligne.article.fonction;
          if (ligne.article.codeInterne) replacements['{v541.codeInterne}'] = ligne.article.codeInterne;
          if (ligne.article.typeMouvement) replacements['{v541.typeMvmt'] = ligne.article.typeMouvement;
          if (ligne.article.sens) replacements['{v541.sens}'] = ligne.article.sens;
          if (ligne.article.structure) replacements['{v542.structure}'] = ligne.article.structure;
          if (ligne.article.gestionnaire) replacements['{v542.gestionnaire}'] = ligne.article.gestionnaire;
        }

        Object.entries(replacements)
          .sort((a, b) => b[0].length - a[0].length) // Longest keys first to avoid {totalHT} matching inside {article.totalHT}
          .forEach(([key, value]) => {
            result = result.split(key).join(value);
          });
        return result;
    };

    // 2. Render Elements
    for (const el of (elements as any[])) {
        const x = el.x;
        const style = el.style || {};
        
        // Handle repeated articles automatically if the value contains '{article.'
        const isRepeated = el.isArticleRepeated || (typeof el.value === 'string' && el.value.includes('{article.'));
        const instances = (isRepeated && occ.lignes && occ.lignes.length > 0) ? occ.lignes : [null];
        
        for (let idx = 0; idx < instances.length; idx++) {
            const ligne = instances[idx];
            // If it repeats automatically but wasn't explicitly set, default pitch to 25
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

                const splitText = doc.splitTextToSize(text, w);
                if (style.textAlign === 'center') {
                    doc.text(splitText, x + w / 2, y + fontSize, { align: 'center' });
                } else if (style.textAlign === 'right') {
                    doc.text(splitText, x + w, y + fontSize, { align: 'right' });
                } else {
                    doc.text(splitText, x, y + fontSize);
                }
            } else if (el.type === 'IMAGE' && el.value) {
                // Image handling: resolve local paths or URLs
                try {
                    let imageData = el.value;
                    if (el.value.startsWith('/')) {
                       const fullPath = join(process.cwd(), 'public', el.value);
                       if (existsSync(fullPath)) {
                          const buffer = await readFile(fullPath);
                          imageData = `data:image/${el.value.endsWith('.png') ? 'png' : 'jpeg'};base64,${buffer.toString('base64')}`;
                       }
                    } else if (el.value.startsWith('http')) {
                        // For external URLs, we might need a fetch but usually el.value is /uploads/...
                    }
                    
                    const format = el.value.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
                    doc.addImage(imageData, format, x, y, w, h);
                } catch (e) {
                    console.warn('Failed to add image to PDF:', e);
                }
            }
        }
    }

    const pdfBuffer = doc.output('arraybuffer');
    const buffer = FromBuffer(pdfBuffer);

    // 3. Save as attachment (PJ)
    try {
        const facturesDir = join(process.cwd(), 'public', 'uploads', 'factures');
        if (!existsSync(facturesDir)) {
          await mkdir(facturesDir, { recursive: true });
        }
        
        const filename = `Facture-${occ.id}-${Date.now()}.pdf`;
        const relativePath = `/uploads/factures/${filename}`;
        const fullPath = join(facturesDir, filename);
        
        await writeFile(fullPath, buffer);
        
        // Update database with the PDF path
        await prisma.occupation.update({
          where: { id: occ.id },
          data: { facturePath: relativePath }
        });
        
    } catch (saveError) {
        console.error('Failed to save PDF attachment:', saveError);
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Facture-ODP-${occ.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[PDF GEN ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Utility to convert arraybuffer to Buffer
function FromBuffer(ab: ArrayBuffer) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}
