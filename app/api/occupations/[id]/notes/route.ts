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
    const notes = await (prisma as any).note.findMany({
      where: { occupationId: parseInt(id) },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(notes);
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
    const { content, pjPath, pjName, sendEmail, contactId } = body;

    let externalId = null;
    let toEmail = null;

    if (sendEmail && contactId) {
      const contact = await (prisma as any).contact.findUnique({
        where: { id: parseInt(contactId) },
        include: { occupation: true }
      });

      if (contact) {
        toEmail = contact.email;
        const subject = `[ODP-#${id}] Nouveau message concernant : ${contact.occupation.nom || 'votre dossier'}`;
        const mailRes = await sendApmMail(
          contact.email,
          subject,
          content,
          "Mairie d'Ivry-sur-Seine" // Official sender name
        );
        externalId = mailRes.id || mailRes.messageId; // Capture Message-ID for tracking
      }
    }

    const note = await (prisma as any).note.create({
      data: {
        occupationId: parseInt(id),
        content,
        author: sendEmail ? "Mairie d'Ivry-sur-Seine" : authorName,
        pjPath: pjPath || null,
        pjName: pjName || null,
        isEmail: sendEmail || false,
        externalId,
        toEmail
      }
    });
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[Notes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
