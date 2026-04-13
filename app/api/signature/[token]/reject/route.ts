import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import { sendApmMail } from '@/lib/apm';
import { generateSignatureRejectionEmail } from '@/lib/signature-email-templates';

/**
 * POST /api/signature/[token]/reject
 * Public endpoint to reject a signature request
 * No authentication required - token-based access
 * Body: { comment?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { comment } = await req.json();

    // Validate token
    const payload = await validateSignatureToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find signature request
    let signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: {
        occupation: true,
        signatory: true
      }
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 }
      );
    }

    // Check token expiration
    if (new Date() > signatureRequest.tokenExpiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Check if already signed/rejected
    if (signatureRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Document has already been ${signatureRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment exceeds maximum length of 500 characters' },
        { status: 400 }
      );
    }

    // Mark as rejected
    const now = new Date();
    signatureRequest = await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        status: 'REJECTED',
        rejectionComment: comment || null,
        signedAt: now // Use signedAt to track when rejection occurred
      },
      include: {
        occupation: {
          include: { tiers: true }
        },
        signatory: true
      }
    });

    // Get settings for admin email
    const settings = await prisma.appSettings.findFirst({
      where: { id: 1 }
    });

    // Send rejection notification to admin (finance email)
    if (settings?.financeEmail) {
      try {
        const rejectedAtStr = now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const emailHtml = generateSignatureRejectionEmail({
          adminEmail: settings.financeEmail,
          signatorName: signatureRequest.signatory.nom,
          occupationRef: signatureRequest.occupation.id.toString(),
          rejectedAt: rejectedAtStr,
          rejectionComment: comment
        });

        await sendApmMail(
          settings.financeEmail,
          `✗ Document rejeté - AOT #${signatureRequest.occupation.id}`,
          emailHtml
        );
      } catch (emailError) {
        console.error('[SignatureReject] Notification email failed:', emailError);
        // Continue - email error doesn't block rejection
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Signature request rejected',
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      rejectionComment: signatureRequest.rejectionComment
    });
  } catch (error: any) {
    console.error('[POST /api/signature/[token]/reject]', error);
    return NextResponse.json(
      { error: 'Failed to reject signature request' },
      { status: 500 }
    );
  }
}
