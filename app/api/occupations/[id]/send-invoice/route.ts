import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendApmMail, MailAttachment } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';
import { getSession } from '@/lib/auth';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const occupationId = parseInt(idStr, 10);
  if (isNaN(occupationId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  try {
    const occ = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        tiers: { include: { contacts: true } },
      },
    });

    if (!occ) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });

    // Ensure dossier is validated (statut VERIFIE, FACTURE or PAYE)
    const allowedStatuts = ['VERIFIE', 'FACTURE', 'PAYE'];
    if (!allowedStatuts.includes(occ.statut)) {
      return NextResponse.json({ 
        error: "L'envoi de la facture n'est possible que si le dossier est validé (Vérifié ou Facturé)." 
      }, { status: 400 });
    }

    // Identify the debtor tiers (Agissant pour or Demandeur)
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

    if (!tierFacturable) {
      return NextResponse.json({ error: 'Aucun tiers facturable trouvé' }, { status: 400 });
    }

    // Find Primary Contact
    const primaryContact = tierFacturable.contacts?.find(
      (c: any) => c.role?.toLowerCase() === 'contact principal'
    );

    if (!primaryContact || !primaryContact.email) {
      return NextResponse.json({ 
        error: `Aucun contact principal avec email trouvé pour le tiers "${tierFacturable.nom}". Veuillez créer un contact principal avant d'envoyer la facture.` 
      }, { status: 400 });
    }

    // Generate Invoice PDF
    const { buffer, filename } = await generateInvoicePdfBuffer(occupationId);

    const attachment: MailAttachment = {
      filename: filename,
      content: buffer.toString('base64'),
      content_type: 'application/pdf',
    };

    const tiersNom = tierFacturable.nom || `Dossier #${occupationId}`;
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const contactNom = [primaryContact.prenom, primaryContact.nom].filter(Boolean).join(' ') || primaryContact.email;
    
    const { html, subject } = await getContextualMessageData('MSG_INVOICE_DEBTOR', {
      CONTACT: contactNom,
      TIERS: tiersNom,
      NOM_DOSSIER: occ.nom || tiersNom,
      DATE: date,
    });

    if (!html) {
      return NextResponse.json({ error: 'Modèle d\'email introuvable' }, { status: 500 });
    }

    await sendApmMail(
      primaryContact.email,
      subject || `Votre facture ODP — ${occ.nom || tiersNom}`,
      html,
      undefined,
      [attachment]
    );

    // Add note to discussion
    const session = await getSession();
    const author = session ? `${session.prenom} ${session.nom}`.trim() : 'Conseiller';
    const noteContent = `📧 Facture envoyée par e-mail au contact principal : ${primaryContact.email} (${contactNom})`;
    
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Note (occupationId, content, author, isEmail, origin, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      occupationId,
      noteContent,
      author,
      false,
      'desktop',
      new Date().toISOString()
    );

    return NextResponse.json({ success: true, sentTo: primaryContact.email });
  } catch (err: any) {
    console.error('[send-invoice]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
