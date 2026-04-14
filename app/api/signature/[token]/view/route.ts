import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';

/**
 * GET /api/signature/[token]/view
 * Public endpoint to retrieve signature request details and document
 * No authentication required - token-based access
 */
export async function GET(
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
    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: {
        occupation: {
          include: { tiers: true }
        },
        signatory: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true
          }
        }
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

    return NextResponse.json({
      requestId: signatureRequest.id,
      token: signatureRequest.token,
      status: signatureRequest.status,
      expiresAt: signatureRequest.tokenExpiresAt.toISOString(),
      occupation: {
        id: signatureRequest.occupation.id,
        type: signatureRequest.occupation.type,
        adresse: signatureRequest.occupation.adresse,
        dateDebut: signatureRequest.occupation.dateDebut,
        dateFin: signatureRequest.occupation.dateFin,
        aotFinalPath: signatureRequest.occupation.aotFinalPath,
        tiers: {
          id: signatureRequest.occupation.tiers.id,
          nom: signatureRequest.occupation.tiers.nom,
          siret: signatureRequest.occupation.tiers.siret
        }
      },
      signatory: signatureRequest.signatory
    });
  } catch (error: any) {
    console.error('[GET /api/signature/[token]/view]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve signature request' },
      { status: 500 }
    );
  }
}
