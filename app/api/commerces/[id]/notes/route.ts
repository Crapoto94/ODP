import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendApmMail } from '@/lib/apm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tiersId = parseInt(id);

    // Get notes from tiers
    const tiersNotes = await (prisma as any).note.findMany({
      where: { tiersId },
      orderBy: { created_at: 'desc' }
    });

    // Get notes from all COMMERCE occupations of this tiers
    const occupationNotes = await (prisma as any).note.findMany({
      where: {
        occupationId: {
          in: await (prisma as any).occupation
            .findMany({
              where: { tiersId, type: 'COMMERCE' },
              select: { id: true }
            })
            .then((occs: any[]) => occs.map((o: any) => o.id))
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Combine and sort by date
    const allNotes = [...tiersNotes, ...occupationNotes].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(allNotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    const authorName = session ? `${session.prenom} ${session.nom}` : 'Conseiller';

    const body = await request.json();
    const { content, pjPath, pjName, pjThumb, sendEmail, contactId, origin } = body;

    let externalId = null;
    let toEmail = null;

    if (sendEmail && contactId) {
      const contact = await (prisma as any).contact.findUnique({
        where: { id: parseInt(contactId) }
      });

      if (contact) {
        toEmail = contact.email;
        const tiersId = parseInt(id);
        const subject = `[Commerce-#${tiersId}] Nouveau message concernant votre commerce`;
        const mailRes = await sendApmMail(
          contact.email,
          subject,
          content,
          "Mairie d'Ivry-sur-Seine"
        );
        externalId = mailRes.id || mailRes.messageId;
      }
    }

    const note = await (prisma as any).note.create({
      data: {
        tiersId: parseInt(id),
        content: content || "",
        author: sendEmail ? "Mairie d'Ivry-sur-Seine" : authorName,
        pjPath: pjPath || null,
        pjName: pjName || null,
        pjThumb: pjThumb || null,
        isEmail: !!sendEmail,
        externalId: externalId || null,
        toEmail: toEmail || null,
        origin: origin || 'desktop',
        created_at: new Date()
      }
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[Commerce Notes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
