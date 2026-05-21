import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendApmMail, MailAttachment } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';


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
        contacts: true,
        tiers: { include: { contacts: true } },
      },
    });

    if (!occ) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
    if (!occ.aotFinalPath) return NextResponse.json({ error: 'Aucun document AOT' }, { status: 400 });

    // Fetch roles marked as isSendAot, plus default roles
    const roleRows = await (prisma as any).$queryRaw`
      SELECT nom FROM "ContactRoleConfig" WHERE "isSendAot" = true
    `;
    const sendAotRoles = new Set((roleRows as any[]).map((r: any) => r.nom.toLowerCase()));
    // Always include CONTACT_DIRECT as a valid role for AOT sending
    sendAotRoles.add('contact_direct');
    console.log('[send-aot] Roles allowed for AOT send:', Array.from(sendAotRoles));

    const allContacts = [
      ...(occ.contacts || []),
      ...(occ.tiers?.contacts || []),
    ];
    console.log('[send-aot] All contacts:', allContacts.map((c: any) => ({ nom: c.nom, email: c.email, role: c.role })));

    const recipients = allContacts.filter(
      (c: any) => c.email && c.role && sendAotRoles.has(c.role.toLowerCase())
    );
    console.log('[send-aot] Recipients after filter:', recipients.map((c: any) => ({ nom: c.nom, email: c.email, role: c.role })));

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun contact "Demandeur" ou "Contact principal" avec email trouvé' }, { status: 400 });
    }

    // Read AOT file
    const aotRelPath = occ.aotFinalPath.replace(/^\//, '');
    const aotAbsPath = path.join(process.cwd(), 'public', aotRelPath);
    if (!fs.existsSync(aotAbsPath)) {
      return NextResponse.json({ error: `Fichier AOT introuvable : ${aotAbsPath}` }, { status: 404 });
    }
    const aotFilename = path.basename(aotAbsPath);
    const aotBuffer = fs.readFileSync(aotAbsPath);

    const isPdf = aotFilename.toLowerCase().endsWith('.pdf');
    const attachment: MailAttachment = {
      filename: aotFilename,
      content: aotBuffer.toString('base64'),
      content_type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const settingsRows = await (prisma as any).$queryRaw`SELECT "appUrl" FROM "AppSettings" WHERE id = 1`;
    const tiersNom = occ.nom || occ.tiers?.nom || `Dossier #${occupationId}`;
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateDebut = occ.dateDebut ? new Date(occ.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const dateFin = occ.dateFin ? new Date(occ.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    const sent: string[] = [];
    for (const contact of recipients) {
      const contactNom = [contact.prenom, contact.nom].filter(Boolean).join(' ') || contact.email;
      const { html, subject } = await getContextualMessageData('MSG_AOT_DEMANDEUR', {
        CONTACT: contactNom,
        TIERS: tiersNom,
        DATE: date,
        'tiers.nom': occ.tiers?.nom || '',
        adresse: occ.adresse || '',
        dateDebut: dateDebut,
        dateFin: dateFin,
      });
      if (!html) continue;
      await sendApmMail(
        contact.email,
        subject || `Votre AOT — ${tiersNom}`,
        html,
        undefined,
        [attachment]
      );
      sent.push(contact.email);
    }

    // Note automatique dans le fil de discussion
    if (sent.length > 0) {
      const session = await getSession();
      const author = session ? `${session.prenom} ${session.nom}`.trim() : 'Conseiller';
      const year = occ.anneeTaxation || new Date().getFullYear();
      const noteContent = `📄 AOT envoyé en pièce jointe à : ${sent.join(', ')} (${year})`;
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "Note" ("occupationId", "content", "author", "isEmail", "origin", "created_at") VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        occupationId,
        noteContent,
        author,
        false,
        'desktop'
      );
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.error('[send-aot] Error:', err.message, err.stack);
    return NextResponse.json({
      error: err.message || 'Erreur inconnue lors de l\'envoi de l\'AOT',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
