import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';
import { generateBillingNotificationEmail } from '@/lib/billing-email-templates';
import { generateSeditValidationToken } from '@/lib/sedit-validation-token';
import { format } from 'date-fns';

export async function sendFinanceNotification(params: {
  appSettings: any;
  session: any;
  billingRunId: string;
  resultsCount: number;
  dossiers: any[];
  agentName: string;
}) {
  const { appSettings, session, billingRunId, resultsCount, dossiers, agentName } = params;

  if (!appSettings?.financeEmail) return;

  // Get agent email
  let agentEmail = '';
  if (session?.id) {
    const agentUser = await (prisma as any).$queryRaw`SELECT email FROM "User" WHERE id = ${session.id} LIMIT 1`;
    if (agentUser && (agentUser as any[]).length > 0) {
      agentEmail = (agentUser as any[])[0].email;
    }
  }

  // Count by type
  const dossiersByType: Record<string, number> = {};
  dossiers.forEach((d: any) => {
    const docType = d.type || 'INCONNU';
    dossiersByType[docType] = (dossiersByType[docType] || 0) + 1;
  });

  const validationToken = await generateSeditValidationToken(
    billingRunId,
    agentEmail,
    agentName,
    resultsCount
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const validationLink = `${appUrl}/dashboard/facturation/sedit-validation?token=${encodeURIComponent(validationToken)}`;

  const notificationEmail = generateBillingNotificationEmail({
    financeEmail: appSettings.financeEmail,
    billingRunId,
    dossiersCount: resultsCount,
    dossierTypes: dossiersByType,
    agentName,
    timestamp: format(new Date(), 'dd/MM/yyyy HH:mm'),
    validationLink,
  });

  await sendApmMail(
    appSettings.financeEmail,
    `[ODP] Nouveau train de facturation prêt - ${billingRunId}`,
    notificationEmail,
    'ODP Console'
  );
}
