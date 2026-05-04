import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSeditValidationToken } from '@/lib/sedit-validation-token';
import { sendApmMail } from '@/lib/apm';
import { generateSeditIntegrationConfirmationEmail } from '@/lib/billing-email-templates';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Validate the token
    const payload = await validateSeditValidationToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
    }

    const { billingRunId, agentEmail, agentName, dossiersCount } = payload;

    // 1. Get all invoices from this billing run
    const billingRun = await (prisma as any).billingRun.findFirst({
      where: { id: billingRunId },
      include: { invoices: true }
    });

    if (!billingRun) {
      return NextResponse.json({ error: 'Train de facturation non trouvé' }, { status: 404 });
    }

    // 2. Update occupations status to 'TITRE'
    const occupationIds = billingRun.invoices.map((inv: any) => inv.dossierId);
    await (prisma as any).occupation.updateMany({
      where: { id: { in: occupationIds } },
      data: { statut: 'TITRE' }
    });

    // 3. Send confirmation email to agent
    // Build dossierTypes from the billing run type
    const dossierTypes: Record<string, number> = {};
    dossierTypes[billingRun.type || 'Dossier'] = billingRun.count;

    const confirmationEmail = generateSeditIntegrationConfirmationEmail({
      agentEmail,
      agentName,
      billingRunId,
      dossiersCount,
      dossierTypes,
      validatedAt: format(new Date(), 'dd/MM/yyyy HH:mm'),
    });

    try {
      await sendApmMail(
        agentEmail,
        `[ODP] Intégration SEDIT confirmée - Train ${billingRunId}`,
        confirmationEmail,
        'ODP Console'
      );
    } catch (mailErr) {
      console.error('Failed to send confirmation email:', mailErr);
      // Don't fail the whole process if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Intégration SEDIT validée avec succès',
      updatedCount: occupationIds.length
    });

  } catch (err: any) {
    console.error('[SEDIT Validation Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
