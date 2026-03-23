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
    const { content, pjPath, pjName, pjThumb, sendEmail, contactId, origin } = body;

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

    // Use raw query to bypass out-of-sync Prisma Client
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Note (occupationId, content, author, pjPath, pjName, pjThumb, isEmail, externalId, toEmail, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      where: { occupationId: parseInt(id) },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[Notes API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
