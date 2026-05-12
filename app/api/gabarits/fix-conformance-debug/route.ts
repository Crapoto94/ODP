import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateInvoiceElements } from '@/lib/invoice-validator';

export async function GET(req: NextRequest) {
  try {
    const gabarit = await (prisma as any).gabarit.findFirst({
      where: { isDefault: true }
    });

    if (!gabarit) {
      return NextResponse.json({ error: 'Aucun gabarit par défaut trouvé' }, { status: 404 });
    }

    const { elements } = JSON.parse(gabarit.contenu);
    const errors = validateInvoiceElements(elements);

    return NextResponse.json({
      gabaritId: gabarit.id,
      gabaritNom: gabarit.nom,
      elementCount: elements.length,
      totalErrors: errors.length,
      errors: errors,
      errorsByType: errors.reduce((acc: any, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      errorsBySeverity: {
        error: errors.filter(e => e.severity === 'error').length,
        warning: errors.filter(e => e.severity === 'warning').length
      }
    });
  } catch (err: any) {
    console.error('[FIX CONFORMANCE DEBUG ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
