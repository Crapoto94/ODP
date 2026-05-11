import { prisma } from '@/lib/prisma';
import { sendApmMail, MailAttachment } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

export async function distributeInvoiceBatch(params: {
  occupationId: number;
  invoiceNumber: string;
  pdfBuffer: Buffer;
  agentName: string;
}) {
  const { occupationId, invoiceNumber, pdfBuffer, agentName } = params;

  try {
    const occ = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        tiers: { include: { contacts: true } },
      },
    });

    if (!occ) return { success: false, error: 'Dossier introuvable' };

    // Determine tiers facturable
    let tierFacturable = occ.tiers;
    if (occ.agissantPour) {
      const tierAgissantPourId = parseInt(occ.agissantPour);
      if (!isNaN(tierAgissantPourId)) {
        tierFacturable = await (prisma as any).tiers.findUnique({
          where: { id: tierAgissantPourId },
          include: { contacts: true }
        }) || occ.tiers;
      }
    }

    const primaryContact = tierFacturable.contacts?.find(
      (c: any) => c.role?.toLowerCase() === 'contact principal'
    );

    if (!primaryContact || !primaryContact.email) {
      return { success: false, error: 'Pas de contact principal avec email' };
    }

    const attachment: MailAttachment = {
      filename: `${invoiceNumber}.pdf`,
      content: pdfBuffer.toString('base64'),
      content_type: 'application/pdf',
    };

    const tiersNom = tierFacturable.nom || `Dossier #${occupationId}`;
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const contactNom = [primaryContact.prenom, primaryContact.nom].filter(Boolean).join(' ') || primaryContact.email;

    const redevanceType = occ.type === 'TLPE'
      ? 'de la Taxe Locale sur la Publicité Extérieure (TLPE)'
      : 'des droits de voirie';
    const activityType = occ.type === 'TLPE' ? 'commerce' : occ.type === 'CHANTIER' ? 'chantier' : occ.type === 'TOURNAGE' ? 'tournage' : 'occupation';

    const { html, subject } = await getContextualMessageData('MSG_INVOICE_DEBTOR', {
      CONTACT: contactNom,
      TIERS: tiersNom,
      NOM_DOSSIER: occ.nom || tiersNom,
      DATE: dateStr,
      REDEVANCE_TYPE: redevanceType,
      ACTIVITE_TYPE: activityType,
    });

    if (!html) return { success: false, error: 'Modèle email manquant' };

    await sendApmMail(
      primaryContact.email,
      subject || `Votre facture ODP — ${occ.nom || tiersNom}`,
      html,
      'Domaine Public',
      [attachment]
    );

    // Audit log
    await (prisma as any).note.create({
      data: {
        occupationId,
        content: `📧 Facture envoyée automatiquement par e-mail au contact principal : ${primaryContact.email} (${contactNom})`,
        author: agentName,
        isEmail: false,
        origin: 'system',
        created_at: new Date()
      }
    });

    return { success: true, email: primaryContact.email };
  } catch (err: any) {
    console.error('[DISTRIBUTION ERROR]', err);
    return { success: false, error: err.message };
  }
}
