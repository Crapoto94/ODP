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

    // Use raw query to handle tiersId
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Note (tiersId, content, author, pjPath, pjName, pjThumb, isEmail, externalId, toEmail, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      parseInt(id),
      content || "",
      sendEmail ? "Mairie d'Ivry-sur-Seine" : authorName,
      pjPath || null,
      pjName || null,
      pjThumb || null,
      sendEmail || false,
      externalId || null,
      toEmail || null,
      origin || 'desktop',
      new Date().toISOString()
    );

    const note = await (prisma as any).note.findFirst({
      where: { tiersId: parseInt(id) },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[Commerce Notes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
