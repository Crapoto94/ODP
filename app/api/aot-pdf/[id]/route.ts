import { NextResponse } from 'next/server';
import { prisma, prismaLocal } from '@/lib/prisma';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { mapFont } from '@/app/dashboard/gabarit/types';
import { RobotoRegular, RobotoBold } from '@/app/dashboard/gabarit/fonts';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
      prismaLocal.appSettings.findFirst()
    ]);
    
    if (!occ) return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });

    // Use aotGabaritId from occupation, or fallback to default
    let gabarit;
    if ((occ as any).aotGabaritId) {
      gabarit = await (prisma as any).gabarit.findUnique({
        where: { id: (occ as any).aotGabaritId }
      });
    }

    // Fallback to default if not found or not specified
    if (!gabarit) {
      gabarit = await (prisma as any).gabarit.findFirst({
        where: { isDefault: true }
      });
    }
    
    if (!gabarit) return NextResponse.json({ error: 'Aucun gabarit défini' }, { status: 500 });

    const { elements } = JSON.parse(gabarit.contenu);
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    // Font injection
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
    doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
    doc.addFont('Roboto-Regular.ttf', 'roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'roboto', 'bold');
    doc.setFont('roboto'); // Default font

    const fromBuffer = (ab: ArrayBuffer) => {
      const buf = Buffer.alloc(ab.byteLength);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buf.length; ++i) buf[i] = view[i];
      return buf;
    };

    const replaceVars = (val: string, ligne?: any) => {
        if (!val) return val;
        let result = val;
        
        const tiersNom = occ.tiers?.nom || '';
        const nature = occ.tiers?.natureJuridique ? `${occ.tiers.natureJuridique} ` : '';
        const agissant = (occ as any).agissantPour ? `, agissant pour le compte de ${(occ as any).agissantPour}` : '';
        const demandeurComplet = `Vu la pétition par laquelle ${nature}${tiersNom}${agissant}, demande l'autorisation d'occuper le domaine public à Ivry-sur-Seine par :`;

        const replacements: Record<string, string> = {
          '{id}': occ.id.toString(),
          '{nom}': occ.nom || '',
          '{tiers.nom}': occ.tiers?.nom || '',
          '{demandeurComplet}': demandeurComplet,
          '{adresse}': (occ.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
          '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
          '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
          '{agissantPour}': (occ as any).agissantPour || '',
          '{today}': format(new Date(), 'dd/MM/yyyy'),
          '{signataireRole}': settings?.signataireRole || '',
          '{signataireDelegation}': settings?.signataireDelegation || '',
          '{signataireNom}': settings?.signataireNom || '',
        };

        if (ligne && ligne.article) {
          replacements['{article.designation}'] = ligne.article.designation || '';
          replacements['{article.quantite}'] = (ligne.quantite1 || 0).toString();
          const d1 = new Date(ligne.dateDebut);
          const d2 = new Date(ligne.dateFin);
          replacements['{article.dates}'] = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
          replacements['{article.details}'] = `${ligne.quantite1} ${ligne.article.modeTaxation?.nom || 'unité(s)'}`;
          replacements['{article.note}'] = (ligne as any).note || '';
          const noteStr = (ligne as any).note ? `\n${(ligne as any).note}` : '';
          replacements['{article.designationcomplete}'] = `${ligne.article.designation || ''}${noteStr}`;
        }

        Object.entries(replacements).sort((a,b) => b[0].length - a[0].length).forEach(([k, v]) => {
          result = result.split(k).join(v);
        });
        return result;
    };



    const renderStyledText = (text: string, x: number, y: number, width: number, fontSize: number, align: string, fontFamily: string, defaultStyle: {bold: boolean, italic: boolean, underline: boolean}) => {
        if (!text) return;
        
        const jsPDFFont = mapFont(fontFamily);
        const fullyDecoded = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<(p|div|section)[^>]*>/gi, '') // Strip block tags but keep content
            .replace(/<\/(p|div|section)>/gi, '\n'); // Convert closing blocks to newline

        // 2. Split by tags and standard newlines
        const tokens = fullyDecoded.split(/(<[^>]*>|\n)/g).filter(t => t !== '');
        
        let currentY = y + fontSize;
        const fontName = jsPDFFont; // Use mapped font name
        
        const styleStack = [{ ...defaultStyle }];

        const getActiveStyle = () => styleStack[styleStack.length - 1];

        const parseTag = (token: string) => {
            const tag = token.toLowerCase();
            if (tag.startsWith('</')) {
                if (styleStack.length > 1) styleStack.pop();
                return;
            }

            const current = { ...getActiveStyle() };
            if (tag === '<b>' || tag === '<strong>' || tag.startsWith('<b ') || tag.startsWith('<strong')) {
                current.bold = true;
            }
            if (tag === '<i>' || tag === '<em>' || tag.startsWith('<i ') || tag.startsWith('<em')) {
                current.italic = true;
            }
            if (tag === '<u>' || tag.startsWith('<u ')) {
                current.underline = true;
            }

            const styleMatch = token.match(/style=["']([^"']*)["']/i);
            if (styleMatch) {
                const s = styleMatch[1].toLowerCase();
                if (s.match(/font-weight\s*:\s*(bold|700|800|900|black)/)) current.bold = true;
                else if (s.match(/font-weight\s*:\s*(normal|400)/)) current.bold = false;
                
                if (s.match(/font-style\s*:\s*italic/)) current.italic = true;
                else if (s.match(/font-style\s*:\s*normal/)) current.italic = false;
                
                if (s.match(/text-decoration\s*:\s*underline/)) current.underline = true;
                else if (s.match(/text-decoration\s*:\s*none/)) current.underline = false;
            }
            styleStack.push(current);
        };

        let lines: { text: string, bold: boolean, italic: boolean, underline: boolean, width: number }[][] = [[]];
        let currentLineWidth = 0;

        tokens.forEach(token => {
            if (token === '\n') {
                lines.push([]);
                currentLineWidth = 0;
            } else if (token.startsWith('<')) {
                parseTag(token);
            } else {
                const style = getActiveStyle();
                const ps = (style.bold && style.italic) ? 'bolditalic' : (style.bold ? 'bold' : (style.italic ? 'italic' : 'normal'));
                
                const words = token.split(/(\s+)/);
                words.forEach(word => {
                    if (!word) return;
                    doc.setFont(fontName, ps);
                    const wordWidth = doc.getTextWidth(word);
                    
                    if (currentLineWidth + wordWidth > width && currentLineWidth > 0) {
                        lines.push([]);
                        currentLineWidth = 0;
                    }
                    
                    lines[lines.length - 1].push({ 
                        text: word, 
                        bold: style.bold, 
                        italic: style.italic, 
                        underline: style.underline, 
                        width: wordWidth 
                    });
                    currentLineWidth += wordWidth;
                });
            }
        });

        lines.forEach(line => {
            let lineX = x;
            const totalLineWidth = line.reduce((sum, part) => sum + part.width, 0);
            
            if (align === 'center') lineX = x + (width - totalLineWidth) / 2;
            else if (align === 'right') lineX = x + width - totalLineWidth;

            line.forEach(part => {
                const ps = (part.bold && part.italic) ? 'bolditalic' : (part.bold ? 'bold' : (part.italic ? 'italic' : 'normal'));
                doc.setFont(fontName, ps);
                doc.text(part.text, lineX, currentY);
                if (part.underline) {
                    doc.setLineWidth(0.5);
                    doc.line(lineX, currentY + 1, lineX + part.width, currentY + 1);
                }
                lineX += part.width;
            });
            currentY += fontSize * 1.3;
        });
    };

    // 2. Render elements
    // We'll track a vertical shift if elements (like articles) expand the content
    let globalYShift = 0;
    const PAGE_HEIGHT = 842;
    const PAGE_WIDTH = 595;
    const PAGE_LIMIT = 820; 
    const TOP_MARGIN = 40;

    // First sort elements by Y to ensure logical flow for shifting (optional but recommended)
    const sortedElements = [...(elements as any[])].sort((a, b) => a.y - b.y);

    for (const el of sortedElements) {
        const style = el.style || {};
        const isRepeated = typeof el.value === 'string' && el.value.includes('{article.');
        const instances = (isRepeated && occ.lignes) ? occ.lignes : [null];
        
        // Initial target Y for this element (base Y + current global shift)
        let baseTgtY = el.y + globalYShift;

        for (let i = 0; i < instances.length; i++) {
            let y = baseTgtY + (i * (el.verticalPitch || (isRepeated ? 25 : 30)));
            
            // Handle page overflow with a cleaner reset
            if (y > PAGE_LIMIT) {
                doc.addPage();
                const shiftDown = (y - TOP_MARGIN);
                globalYShift -= shiftDown;
                baseTgtY -= shiftDown;
                y = TOP_MARGIN;
            }

            if (el.type === 'RECT' && !style.noBackground && style.backgroundColor && style.backgroundColor !== 'transparent') {
                doc.setFillColor(style.backgroundColor);
                doc.rect(el.x, y, el.width, el.height, 'F');
            } else if (el.type === 'TEXT' || el.type === 'VARIABLE') {
                const text = replaceVars(el.value, instances[i]);
                if (text) {
                    doc.setFontSize(style.fontSize || 12);
                    doc.setTextColor(style.color || '#000000');
                    
                    const align = style.textAlign || 'left';
                    const x = el.x; // Pass base X, renderStyledText handles internal alignment relative to width

                    const fontFamily = style.fontFamily || 'Helvetica'; 
                    const defaultStyle = {
                        bold: el.style.fontWeight === 'bold',
                        italic: el.style.fontStyle === 'italic',
                        underline: el.style.textDecoration === 'underline'
                    };
                    renderStyledText(text, x, y, el.width, style.fontSize || 12, align, fontFamily, defaultStyle);
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

        // If this was a repeated block, update the global shift for subsequent elements
        if (isRepeated && instances.length > 1) {
            globalYShift += (instances.length - 1) * (el.verticalPitch || 25);
        }
    }

    const output = doc.output('arraybuffer');
    
    return new Response(output, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AOT-${occ.id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[AOT PDF ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
