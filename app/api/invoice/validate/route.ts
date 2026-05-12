import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateInvoiceElements, formatValidationErrors } from '@/lib/invoice-validator';

export async function POST(req: NextRequest) {
  try {
    const { occupationId, tiersId, annee } = await req.json();

    // Déterminer le gabarit à utiliser
    let occ: any = null;
    let gabarit: any = null;

    if (occupationId) {
      occ = await (prisma as any).occupation.findUnique({
        where: { id: occupationId },
        include: {
          tiers: true,
          lignes: { include: { article: { include: { modeTaxation: true } } } }
        }
      });

      if (!occ) {
        return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });
      }

      const typeConfig = await (prisma as any).typeDossierConfig.findUnique({
        where: { type: occ.type }
      });

      if (typeConfig?.invoiceTemplateId) {
        gabarit = await (prisma as any).gabarit.findUnique({
          where: { id: parseInt(typeConfig.invoiceTemplateId) }
        });
      }
    } else if (tiersId && annee) {
      const occs = await (prisma as any).occupation.findMany({
        where: { tiersId, anneeTaxation: annee },
        include: { tiers: true }
      });

      if (occs.length === 0) {
        return NextResponse.json({ error: 'Aucune occupation trouvée' }, { status: 404 });
      }

      occ = occs[0];
      const typeConfig = await (prisma as any).typeDossierConfig.findUnique({
        where: { type: occ.type }
      });

      if (typeConfig?.invoiceTemplateId) {
        gabarit = await (prisma as any).gabarit.findUnique({
          where: { id: parseInt(typeConfig.invoiceTemplateId) }
        });
      }
    } else {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (!gabarit) {
      gabarit = await (prisma as any).gabarit.findFirst({
        where: { isDefault: true }
      });
    }

    if (!gabarit) {
      return NextResponse.json({ error: 'Aucun gabarit défini' }, { status: 500 });
    }

    // Valider les éléments du gabarit
    const { elements } = JSON.parse(gabarit.contenu);
    const errors = validateInvoiceElements(elements);

    const report = formatValidationErrors(errors);
    const isValid = errors.filter(e => e.severity === 'error').length === 0;

    return NextResponse.json({
      success: true,
      valid: isValid,
      errors: errors,
      report: report,
      dossierId: occupationId || tiersId,
      templateId: gabarit.id,
      templateName: gabarit.nom
    });

  } catch (err: any) {
    console.error('[INVOICE VALIDATION ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
