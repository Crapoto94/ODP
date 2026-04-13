import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateSignatureToken, getTokenExpirationDate } from '@/lib/signature-token';
import { sendApmMail } from '@/lib/apm';
import { generateSignatureRequestEmail } from '@/lib/signature-email-templates';

/**
 * POST /api/occupations/[occupationId]/signature-request
 * Initiate a signature request for an occupation
 * Request body: { signatoriesId?, documentType ('pdf' or 'docx') }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ occupationId: string }> }
) {
  try {
    const { occupationId: occupationIdStr } = await params;
    const occupationId = parseInt(occupationIdStr);

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
    const settings = await prisma.appSettings.findFirst({
      where: { id: 1 }
    });

    // Generate token
    const tokenExpirationDate = getTokenExpirationDate(7);
    let signatureToken = '';
    let signatureRequest;

    // Create signature request (temp, to get ID for token)
    const tempRequest = await prisma.signatureRequest.create({
      data: {
        occupationId,
        signatoriesId: signatory.id,
        status: 'PENDING',
        token: 'temp', // Placeholder
        tokenExpiresAt: tokenExpirationDate
      }
    });

    // Generate actual token with request ID
    signatureToken = await generateSignatureToken(
      occupationId,
      signatory.id,
      tempRequest.id
    );

    // Update request with actual token
    signatureRequest = await prisma.signatureRequest.update({
      where: { id: tempRequest.id },
      data: { token: signatureToken }
    });

    // Generate signature link
    const baseUrl = (settings?.appUrl || 'http://localhost:3000').replace(/\/$/, '');
    const signatureLink = `${baseUrl}/signature/${signatureToken}`;

    // Format dates for email
    const expirationDateStr = tokenExpirationDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to signatory
    try {
      const emailHtml = generateSignatureRequestEmail({
        signatorName: signatory.nom,
        signatorEmail: signatory.email,
        occupationRef: occupation.id.toString(),
        occupationType: occupation.type || 'AOT',
        signatureLink,
        expirationDate: expirationDateStr,
        appName: 'ODP Console'
      });

      await sendApmMail(
        signatory.email,
        `Signature requise - AOT #${occupation.id}`,
        emailHtml
      );
    } catch (emailError) {
      console.error('[SignatureRequest] Email sending failed:', emailError);
      // Continue even if email fails - still create the signature request
    }

    return NextResponse.json({
      requestId: signatureRequest.id,
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
    console.error('[POST /api/occupations/[occupationId]/signature-request]', error);
    return NextResponse.json(
      { error: 'Failed to create signature request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/occupations/[occupationId]/signature-request
 * List all signature requests for an occupation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ occupationId: string }> }
) {
  try {
    const { occupationId: occupationIdStr } = await params;
    const occupationId = parseInt(occupationIdStr);

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
    console.error('[GET /api/occupations/[occupationId]/signature-request]', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature requests' },
      { status: 500 }
    );
  }
}
