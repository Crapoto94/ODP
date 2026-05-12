import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateInvoiceElements } from '@/lib/invoice-validator';

const MARGINS = {
  left: 11.338,
  right: 11.338,
  top: 11.338,
  bottom: 11.338
};

const PAGE_WIDTH = 595.276;
const PAGE_HEIGHT = 841.890;

export async function POST(req: NextRequest) {
  try {
    // Get default gabarit
    const gabarit = await (prisma as any).gabarit.findFirst({
      where: { isDefault: true }
    });

    if (!gabarit) {
      return NextResponse.json({ error: 'Aucun gabarit par défaut trouvé' }, { status: 404 });
    }

    const { elements } = JSON.parse(gabarit.contenu);

    // Validate before fixing
    const errorsBefore = validateInvoiceElements(elements);
    console.log(`[FIX CONFORMANCE] Erreurs avant: ${errorsBefore.length}`);

    // Fix elements
    const fixedElements = elements.map((el: any) => {
      const fixed = { ...el };

      // Fix position constraints (marges)
      if (fixed.x < MARGINS.left) {
        console.log(`[FIX] Ajustement X de ${fixed.x} à ${MARGINS.left} pour "${fixed.name}"`);
        fixed.x = MARGINS.left;
      }

      if (fixed.y < MARGINS.top) {
        console.log(`[FIX] Ajustement Y de ${fixed.y} à ${MARGINS.top} pour "${fixed.name}"`);
        fixed.y = MARGINS.top;
      }

      // Check right margin
      if (fixed.x + (fixed.width || 0) > PAGE_WIDTH - MARGINS.right) {
        const newWidth = PAGE_WIDTH - MARGINS.right - fixed.x;
        console.log(`[FIX] Ajustement largeur de ${fixed.width} à ${newWidth} pour "${fixed.name}"`);
        fixed.width = Math.max(10, newWidth);
      }

      // Check bottom margin
      if (fixed.y + (fixed.height || 0) > PAGE_HEIGHT - MARGINS.bottom) {
        const newHeight = PAGE_HEIGHT - MARGINS.bottom - fixed.y;
        console.log(`[FIX] Ajustement hauteur de ${fixed.height} à ${newHeight} pour "${fixed.name}"`);
        fixed.height = Math.max(10, newHeight);
      }

      // Fix colors - convert to grayscale if not already
      if (fixed.style?.color && fixed.style.color !== '#000000' && fixed.style.color !== '#ffffff') {
        const color = fixed.style.color;
        if (color.startsWith('#')) {
          try {
            const hex = color.slice(1);
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            if (r !== g || g !== b) {
              // Convert to grayscale using luminance formula
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              const grayHex = gray.toString(16).padStart(2, '0');
              const newColor = `#${grayHex}${grayHex}${grayHex}`;
              console.log(`[FIX] Conversion couleur de ${color} à ${newColor} pour "${fixed.name}"`);
              fixed.style.color = newColor;
            }
          } catch (err) {
            console.warn(`[FIX] Impossible de parser la couleur ${color}`);
          }
        }
      }

      // Fix background colors
      if (fixed.style?.backgroundColor && fixed.style.backgroundColor !== 'transparent' && fixed.style.backgroundColor !== '#ffffff') {
        const bgColor = fixed.style.backgroundColor;
        if (bgColor.startsWith('#')) {
          try {
            const hex = bgColor.slice(1);
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            if (r !== g || g !== b) {
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              const grayHex = gray.toString(16).padStart(2, '0');
              const newColor = `#${grayHex}${grayHex}${grayHex}`;
              console.log(`[FIX] Conversion BG couleur de ${bgColor} à ${newColor} pour "${fixed.name}"`);
              fixed.style.backgroundColor = newColor;
            }
          } catch (err) {
            console.warn(`[FIX] Impossible de parser la BG couleur ${bgColor}`);
          }
        }
      }

      // Remove transparency
      if (fixed.style?.backgroundColor === 'transparent') {
        console.log(`[FIX] Suppression de la transparence pour "${fixed.name}"`);
        fixed.style.backgroundColor = '#ffffff';
      }

      // Ensure opacity is set correctly
      if (fixed.style?.opacity && fixed.style.opacity < 1) {
        console.log(`[FIX] Ajustement opacity de ${fixed.style.opacity} à 1 pour "${fixed.name}"`);
        fixed.style.opacity = 1;
      }

      return fixed;
    });

    // Validate after fixing
    const errorsAfter = validateInvoiceElements(fixedElements);
    console.log(`[FIX CONFORMANCE] Erreurs après: ${errorsAfter.length}`);

    // Update gabarit
    const updatedGabarit = await (prisma as any).gabarit.update({
      where: { id: gabarit.id },
      data: {
        contenu: JSON.stringify({ elements: fixedElements })
      }
    });

    return NextResponse.json({
      success: true,
      gabaritId: gabarit.id,
      gabaritNom: gabarit.nom,
      beforeErrors: errorsBefore.length,
      afterErrors: errorsAfter.length,
      errorsFixed: errorsBefore.length - errorsAfter.length,
      details: {
        remainingErrors: errorsAfter.filter(e => e.severity === 'error').length,
        remainingWarnings: errorsAfter.filter(e => e.severity === 'warning').length
      }
    });

  } catch (err: any) {
    console.error('[FIX CONFORMANCE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
