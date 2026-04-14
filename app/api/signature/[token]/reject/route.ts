import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

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
        occupation: { include: { tiers: true } },
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

    // Get settings for admin email + appUrl
    const settings = await prisma.appSettings.findFirst({
      where: { id: 1 }
    });
    const baseUrl = (settings?.appUrl || 'http://localhost:3000').replace(/\/$/, '');
    const lienDossier = `${baseUrl}/dashboard/occupations/${signatureRequest.occupation.id}`;
    const tiersNom = (signatureRequest.occupation as any).tiers?.nom || `Dossier #${signatureRequest.occupation.id}`;

    const rejectedAtStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Notification admin (finance email)
    if (settings?.financeEmail) {
      try {
        const { html: emailHtml, subject: emailSubject } = await getContextualMessageData('MSG_SIGNATURE_REJET', {
          SIGNATAIRE: signatureRequest.signatory.nom,
          AOT_REF: signatureRequest.occupation.id.toString(),
          DATE_REJET: rejectedAtStr,
          COMMENTAIRE: comment || '',
        });
        await sendApmMail(
          settings.financeEmail,
          emailSubject || `✗ Signature refusée — ${tiersNom}`,
          emailHtml
        );
      } catch (emailError) {
        console.error('[SignatureReject] Notification admin failed:', emailError);
      }
    }

    // Notifier le demandeur
    try {
      const reqRows = await (prisma as any).$queryRaw`
        SELECT requestedByLogin FROM SignatureRequest WHERE id = ${signatureRequest.id} LIMIT 1
      `;
      const reqLogin = (reqRows as any[])[0]?.requestedByLogin;
      if (reqLogin && reqLogin !== 'admin') {
        const userRows = await (prisma as any).$queryRaw`
          SELECT email, prenom, nom FROM "User" WHERE login = ${reqLogin} LIMIT 1
        `;
        const requester = (userRows as any[])[0];
        if (requester?.email) {
          const { html: emailHtml, subject: emailSubject } = await getContextualMessageData('MSG_AOT_REFUSE', {
            DEMANDEUR: `${requester.prenom} ${requester.nom}`.trim() || reqLogin,
            TIERS: tiersNom,
            LIEN_DOSSIER: lienDossier,
            SIGNATAIRE: signatureRequest.signatory.nom,
            DATE_REJET: rejectedAtStr,
            COMMENTAIRE: comment || '',
          });
          await sendApmMail(requester.email, emailSubject || `⚠️ AOT refusé — ${tiersNom}`, emailHtml);
        }
      }
    } catch (notifErr) {
      console.warn('[Reject] Notification demandeur échouée:', notifErr);
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
