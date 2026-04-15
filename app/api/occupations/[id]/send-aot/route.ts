import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const occupationId = parseInt(idStr, 10);
  if (isNaN(occupationId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  try {
    // Fetch occupation with contacts (dossier + tiers)
    const occ = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        contacts: true,
        tiers: { include: { contacts: true } },
      },
    });

    if (!occ) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
    if (!occ.aotFinalPath) return NextResponse.json({ error: 'Aucun document AOT' }, { status: 400 });

    // Fetch roles marked as isSendAot
    const roleRows = await (prisma as any).$queryRaw`
      SELECT nom FROM ContactRoleConfig WHERE isSendAot = 1
    `;
    const sendAotRoles = new Set((roleRows as any[]).map((r: any) => r.nom.toLowerCase()));

    // Build recipient list from dossier contacts + inherited tiers contacts
    const allContacts = [
      ...(occ.contacts || []),
      ...(occ.tiers?.contacts || []),
    ];

    const recipients = allContacts.filter(
      (c: any) => c.email && c.role && sendAotRoles.has(c.role.toLowerCase())
    );

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun contact "Demandeur" ou "Contact principal" avec email trouvé' }, { status: 400 });
    }

    // App URL for links
    const settingsRows = await (prisma as any).$queryRaw`SELECT appUrl FROM AppSettings WHERE id = 1`;
    const baseUrl = ((settingsRows as any[])[0]?.appUrl || 'http://localhost:3000').replace(/\/$/, '');
    const lienDossier = `${baseUrl}/dashboard/occupations/${occupationId}`;
    const lienAot = occ.aotFinalPath.startsWith('http') ? occ.aotFinalPath : `${baseUrl}${occ.aotFinalPath}`;
    const tiersNom = occ.tiers?.nom || `Dossier #${occupationId}`;
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const sent: string[] = [];
    for (const contact of recipients) {
      const contactNom = [contact.prenom, contact.nom].filter(Boolean).join(' ') || contact.email;
      const { html, subject } = await getContextualMessageData('MSG_AOT_DEMANDEUR', {
        CONTACT: contactNom,
        TIERS: tiersNom,
        LIEN_AOT: lienAot,
        LIEN_DOSSIER: lienDossier,
        DATE: date,
      });
      if (!html) continue;
      await sendApmMail(contact.email, subject || `Votre AOT — ${tiersNom}`, html);
      sent.push(contact.email);
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.error('[send-aot]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
