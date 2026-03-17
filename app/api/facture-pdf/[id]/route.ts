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
    const [occ, gabarit] = await Promise.all([
      prisma.occupation.findUnique({
        where: { id },
        include: { 
          tiers: true,
          lignes: { include: { article: true } }
        }
      }),
      (prisma as any).gabarit.findFirst({
        where: { isDefault: true }
      })
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

    // Helper to replace variables (global replacement)
    const replaceVars = (val: string) => {
        if (!val) return val;
        let result = val;
        const totalSum = occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || 0;

        const replacements: Record<string, string> = {
          '{id}': occ.id.toString(),
          '{nom}': occ.nom || '',
          '{tiers.nom}': occ.tiers.nom,
          '{adresse}': occ.adresse,
          '{dateDebut}': format(new Date(occ.dateDebut), 'dd/MM/yyyy'),
          '{dateFin}': format(new Date(occ.dateFin), 'dd/MM/yyyy'),
          '{totalTTC}': `${totalSum.toFixed(2)} €`,
          '{totalHT}': `${totalSum.toFixed(2)} €`, // Backwards compatibility for templates
          '{today}': format(new Date(), 'dd/MM/yyyy')
        };

        Object.entries(replacements).forEach(([key, value]) => {
          result = result.split(key).join(value); // Equivalent to replaceAll
        });
        return result;
    };

    // 2. Render Elements
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
            if (style.borderWidth > 0) {
                doc.setDrawColor(style.borderColor || '#000000');
                doc.setLineWidth(style.borderWidth);
                doc.rect(x, y, w, h, 'S');
            }
        } else if (el.type === 'TEXT' || el.type === 'VARIABLE') {
            const text = el.type === 'VARIABLE' ? replaceVars(el.value) : el.value;
            if (!text) continue;

            const fontSize = style.fontSize || 12;
            doc.setFontSize(fontSize);
            doc.setTextColor(style.color || '#000000');
            
            // Font weight mapping
            const weight = style.fontWeight === 'bold' || style.fontWeight === 'black' ? 'bold' : 'normal';
            // Simple font family mapping (jspdf supports standard fonts by default)
            let family = 'helvetica';
            if (style.fontFamily?.includes('Times')) family = 'times';
            else if (style.fontFamily?.includes('Courier')) family = 'courier';
            
            doc.setFont(family, weight);

            // Handle multiline and alignment
            const splitText = doc.splitTextToSize(text, w);
            let textX = x;
            if (style.textAlign === 'center') {
                textX = x + w / 2;
                doc.text(splitText, textX, y + fontSize, { align: 'center' });
            } else if (style.textAlign === 'right') {
                textX = x + w;
                doc.text(splitText, textX, y + fontSize, { align: 'right' });
            } else {
                doc.text(splitText, textX, y + fontSize);
            }
        } else if (el.type === 'IMAGE' && el.value) {
            try {
                // For server-side rendering, resolve local paths to Base64
                let imageData = el.value;
                if (el.value.startsWith('/')) {
                   const fullPath = join(process.cwd(), 'public', el.value);
                   if (existsSync(fullPath)) {
                      const buffer = await readFile(fullPath);
                      imageData = `data:image/${el.value.endsWith('.png') ? 'png' : 'jpeg'};base64,${buffer.toString('base64')}`;
                   }
                }
                
                const format = el.value.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
                doc.addImage(imageData, format, x, y, w, h);
            } catch (e) {
                console.warn('Failed to add image to PDF:', e);
            }
        }
    }

    const pdfBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfBuffer);

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
