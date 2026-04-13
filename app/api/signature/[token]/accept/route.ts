import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import { signPDF, signDOCX } from '@/lib/document-signer';
import { sendApmMail } from '@/lib/apm';
import { generateSignatureAcceptanceEmail } from '@/lib/signature-email-templates';
import * as fs from 'fs';
import * as path from 'path';

/**
 * POST /api/signature/[token]/accept
 * Public endpoint to accept and sign a document
 * No authentication required - token-based access
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
        occupation: {
          include: { tiers: true }
        },
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

    // Get settings for signature image and certificate
    const settings = await prisma.appSettings.findFirst({
      where: { id: 1 }
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'System configuration not found' },
        { status: 500 }
      );
    }

    // TODO: For now, just mark as signed. In full implementation, would:
    // 1. Load the AOT document (PDF or DOCX)
    // 2. Apply signature image and P12 certificate
    // 3. Save signed document
    // 4. Return download link

    // Mark as accepted
    const now = new Date();
    signatureRequest = await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        status: 'ACCEPTED',
        signedAt: now
      },
      include: {
        occupation: {
          include: { tiers: true }
        },
        signatory: true
      }
    });

    // Send confirmation email to admin (finance email)
    if (settings.financeEmail) {
      try {
        const signedAtStr = now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const emailHtml = generateSignatureAcceptanceEmail({
          adminEmail: settings.financeEmail,
          signatorName: signatureRequest.signatory.nom,
          occupationRef: signatureRequest.occupation.id.toString(),
          signedAt: signedAtStr
        });

        await sendApmMail(
          settings.financeEmail,
          `✓ Document signé - AOT #${signatureRequest.occupation.id}`,
          emailHtml
        );
      } catch (emailError) {
        console.error('[SignatureAccept] Confirmation email failed:', emailError);
        // Continue - email error doesn't block signature acceptance
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      signedAt: signatureRequest.signedAt?.toISOString()
    });
  } catch (error: any) {
    console.error('[POST /api/signature/[token]/accept]', error);
    return NextResponse.json(
      { error: 'Failed to sign document' },
      { status: 500 }
    );
  }
}
