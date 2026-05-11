import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateSignatureToken, getTokenExpirationDate } from '@/lib/signature-token';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

/**
 * POST /api/occupations/[id]/signature-request
 * Initiate a signature request for an occupation
 * Request body: { signatoriesId?, documentType ('pdf' or 'docx') }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const occupationId = parseInt(idStr);

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { signatoriesId, documentType = 'pdf' } = await req.json();

    // Validate occupation exists
    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
      include: { tiers: true }
    });

    if (!occupation) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    // Validate document type
    if (!['pdf', 'docx'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid documentType. Must be "pdf" or "docx"' },
        { status: 400 }
      );
    }

    // Get signatory - use provided ID or default
    let signatory;
    if (signatoriesId) {
      signatory = await prisma.signatory.findUnique({
        where: { id: signatoriesId }
      });
    } else {
      signatory = await prisma.signatory.findFirst({
        where: { isDefault: true, statut: 'ACTIF' }
      });
    }

    if (!signatory) {
      return NextResponse.json(
        { error: 'No signatory found. Please configure a default signatory.' },
        { status: 400 }
      );
    }

    // Get app settings for sender info and links
    const settings = await (prisma as any).appSettings.findFirst({
      where: { id: 1 }
    });

    // Generate token expiration
    const tokenExpirationDate = getTokenExpirationDate(7);

    // Create signature request (temp, to get ID for token)
    const requestedBy = session.login ?? null;
    const tempToken = `__tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const signatureRequest = await (prisma as any).signatureRequest.create({
      data: {
        occupationId,
        signatoriesId: signatory.id,
        status: 'PENDING',
        token: tempToken,
        tokenExpiresAt: tokenExpirationDate,
        requestedByLogin: requestedBy
      }
    });

    const tempId = signatureRequest.id;

    // Generate actual token with request ID
    const signatureToken = await generateSignatureToken(
      occupationId,
      signatory.id,
      tempId
    );

    // Update request with actual token
    await (prisma as any).signatureRequest.update({
      where: { id: tempId },
      data: { token: signatureToken }
    });

    // Generate signature link
    const baseUrl = (settings?.appUrl || 'http://localhost:3000').replace(/\/$/, '');
    const signatureLink = `${baseUrl}/signature/${signatureToken}`;

    // Format expiration date for email
    const expirationDateStr = tokenExpirationDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to signatory
    let emailSent = false;
    try {
      const { html: emailHtml, subject: emailSubject } = await getContextualMessageData('MSG_SIGNATURE_REQUEST', {
        SIGNATAIRE: signatory.nom,
        AOT_REF: occupation.id.toString(),
        AOT_TYPE: occupation.type || 'AOT',
        LIEN_SIGNATURE: signatureLink,
        DATE_EXPIRATION: expirationDateStr,
      });

      await sendApmMail(
        signatory.email,
        emailSubject || `Signature requise — AOT #${occupation.id}`,
        emailHtml
      );
      emailSent = true;
    } catch (emailError) {
      console.error('[SignatureRequest] Email sending failed:', emailError);
      // Continue even if email fails - still create the signature request
    }

    // Add automatic note if email was sent
    if (emailSent) {
      try {
        const year = occupation.anneeTaxation || new Date().getFullYear();
        const noteContent = `📝 Demande de signature envoyée à ${signatory.nom} (${signatory.email}) - Expire le ${expirationDateStr} (${year})`;
        await (prisma as any).note.create({
          data: {
            occupationId,
            content: noteContent,
            author: 'Système',
            isEmail: false,
            origin: 'desktop',
            created_at: new Date()
          }
        });
      } catch (noteError) {
        console.error('[SignatureRequest] Failed to create note:', noteError);
      }
    }

    return NextResponse.json({
      requestId: tempId,
      token: signatureToken,
      signatory: {
        id: signatory.id,
        nom: signatory.nom,
        email: signatory.email,
        role: signatory.role
      },
      sentAt: new Date().toISOString(),
      expiresAt: tokenExpirationDate.toISOString(),
      signatureLink
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/occupations/[id]/signature-request]', error);
    return NextResponse.json(
      { error: 'Failed to create signature request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/occupations/[id]/signature-request
 * List all signature requests for an occupation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const occupationId = parseInt(idStr);

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requests = await prisma.signatureRequest.findMany({
      where: { occupationId },
      include: {
        signatory: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('[GET /api/occupations/[id]/signature-request]', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature requests' },
      { status: 500 }
    );
  }
}
