import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { PDFDocument } from 'pdf-lib';
import * as forge from 'node-forge';

function getLibreOfficeBin(): string {
  if (process.platform !== 'win32') return 'libreoffice';

  const roots = [
    process.env['ProgramFiles'] || 'C:\\Program Files',
    process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
  ];
  for (const root of roots) {
    try {
      for (const entry of fs.readdirSync(root)) {
        if (entry.toLowerCase().startsWith('libreoffice')) {
          for (const bin of ['soffice.com', 'soffice.exe', 'soffice_safe.exe']) {
            const candidate = path.join(root, entry, 'program', bin);
            if (fs.existsSync(candidate)) return candidate;
          }
        }
      }
    } catch {}
  }
  throw new Error('LibreOffice introuvable dans Program Files.');
}

/**
 * Convert a DOCX to PDF using LibreOffice headless.
 * Uses spawnSync with shell:false — no cmd.exe, no AV issues.
 */
function convertDocxToPdf(docxAbsPath: string): string {
  const outDir = path.dirname(docxAbsPath);
  const baseName = path.basename(docxAbsPath, path.extname(docxAbsPath));
  const pdfAbsPath = path.join(outDir, `${baseName}.pdf`);

  if (fs.existsSync(pdfAbsPath)) {
    return pdfAbsPath;
  }

  const bin = getLibreOfficeBin();
  const result = spawnSync(
    bin,
    ['--headless', '--convert-to', 'pdf', '--outdir', outDir, docxAbsPath],
    { timeout: 60000, windowsHide: true, shell: false }
  );

  if (result.error) {
    throw new Error(`LibreOffice introuvable : ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`LibreOffice a échoué (code ${result.status}) : ${result.stderr?.toString()}`);
  }
  if (!fs.existsSync(pdfAbsPath)) {
    throw new Error('PDF conversion failed: output file not created');
  }

  return pdfAbsPath;
}

/**
 * POST /api/signature/[token]/accept
 * Public endpoint to accept and sign a document
 * No authentication required - token-based access
 *
 * Body: { signatureX?: number, signatureY?: number, signaturePage?: number }
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

    // Parse body — may be empty for backwards compat
    let signatureX = 75;
    let signatureY = 85;
    let signaturePage: number | null = null;

    try {
      const body = await req.json();
      if (typeof body.signatureX === 'number') signatureX = body.signatureX;
      if (typeof body.signatureY === 'number') signatureY = body.signatureY;
      if (typeof body.signaturePage === 'number') signaturePage = body.signaturePage;
    } catch {
      // no body — use defaults
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

    // --- PDF Signing ---
    const aotFinalPath = signatureRequest.occupation.aotFinalPath;
    let signedPdfPublicPath: string | null = null;

    if (aotFinalPath) {
      try {
        // Resolve the source document to a PDF
        let pdfAbsPath: string;

        if (aotFinalPath.toLowerCase().endsWith('.docx')) {
          const docxAbsPath = path.join(process.cwd(), 'public', aotFinalPath.replace(/^\//, ''));
          pdfAbsPath = convertDocxToPdf(docxAbsPath);
        } else {
          pdfAbsPath = path.join(process.cwd(), 'public', aotFinalPath.replace(/^\//, ''));
        }

        if (fs.existsSync(pdfAbsPath)) {
          const pdfBytes = fs.readFileSync(pdfAbsPath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = pdfDoc.getPages();
          const totalPages = pages.length;

          // Determine target page (1-indexed, default last page)
          const targetPageIndex =
            signaturePage !== null
              ? Math.max(0, Math.min(signaturePage - 1, totalPages - 1))
              : totalPages - 1;

          const page = pages[targetPageIndex];
          const { width, height } = page.getSize();

          // Signature box size in points (150x75)
          const sigWidth = 150;
          const sigHeight = 75;

          // Convert percentage to PDF coordinates (PDF y=0 is bottom)
          const xPos = (signatureX / 100) * width - sigWidth / 2;
          const yPos = height - (signatureY / 100) * height - sigHeight / 2;

          // Embed fonts for text under signature
          const { StandardFonts, rgb } = await import('pdf-lib');
          const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          // Try to embed signature image
          const signatory = signatureRequest.signatory;
          let imageEmbedded = false;

          if (signatory.signatureImagePath) {
            try {
              const imgAbsPath = fs.existsSync(signatory.signatureImagePath)
                ? signatory.signatureImagePath
                : path.join(process.cwd(), 'public', signatory.signatureImagePath.replace(/^\//, ''));

              if (fs.existsSync(imgAbsPath)) {
                const imgBytes = fs.readFileSync(imgAbsPath);
                const imgExt = imgAbsPath.toLowerCase();
                let embeddedImage;

                if (imgExt.endsWith('.png')) {
                  embeddedImage = await pdfDoc.embedPng(imgBytes);
                } else {
                  embeddedImage = await pdfDoc.embedJpg(imgBytes);
                }

                // Preserve aspect ratio within the signature box
                const { width: natW, height: natH } = embeddedImage.scale(1);
                const imgRatio = natW / natH;
                const boxRatio = sigWidth / sigHeight;
                let drawW = sigWidth;
                let drawH = sigHeight;
                if (imgRatio > boxRatio) {
                  drawH = sigWidth / imgRatio;
                } else {
                  drawW = sigHeight * imgRatio;
                }
                const drawX = xPos + (sigWidth - drawW) / 2;
                const drawY = yPos + (sigHeight - drawH) / 2;

                page.drawImage(embeddedImage, {
                  x: Math.max(0, drawX),
                  y: Math.max(0, drawY),
                  width: drawW,
                  height: drawH,
                });

                imageEmbedded = true;
              }
            } catch (imgErr) {
              console.error('[SignatureAccept] Failed to embed signature image:', imgErr);
            }
          }

          if (!imageEmbedded) {
            // Placeholder rectangle when no image
            page.drawRectangle({
              x: Math.max(0, xPos),
              y: Math.max(0, yPos),
              width: sigWidth,
              height: sigHeight,
              borderColor: rgb(0.2, 0.4, 0.8),
              borderWidth: 1,
              color: rgb(0.95, 0.97, 1.0),
            });
          }

          // Draw nom + titre/rôle below the signature box
          const textX = Math.max(0, xPos);
          const nameFontSize = 7;
          const subtitleFontSize = 6;
          const lineGap = 9;

          page.drawText(signatory.nom, {
            x: textX,
            y: Math.max(0, yPos - lineGap),
            size: nameFontSize,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
            maxWidth: sigWidth,
          });

          const subtitle = signatory.titre || signatory.role;
          if (subtitle) {
            page.drawText(subtitle, {
              x: textX,
              y: Math.max(0, yPos - lineGap * 2),
              size: subtitleFontSize,
              font: fontRegular,
              color: rgb(0.3, 0.3, 0.3),
              maxWidth: sigWidth,
            });
          }

          // Save signed PDF bytes
          let finalPdfBytes = await pdfDoc.save();

          // Try P12 digital signature (best-effort)
          if (signatory.signatureCertificatePath && signatory.signatureCertificatePassword) {
            try {
              const p12AbsPath = fs.existsSync(signatory.signatureCertificatePath)
                ? signatory.signatureCertificatePath
                : path.join(process.cwd(), 'public', signatory.signatureCertificatePath.replace(/^\//, ''));

              if (fs.existsSync(p12AbsPath)) {
                const p12Buffer = fs.readFileSync(p12AbsPath);
                const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
                const p12 = forge.pkcs12.pkcs12FromAsn1(
                  p12Asn1,
                  false,
                  signatory.signatureCertificatePassword
                );

                // Validate cert is readable — actual PDF/A signing is complex; log success
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                console.log('[SignatureAccept] P12 certificate loaded successfully, cert bags:', Object.keys(certBags).length);
                // Note: Full PDF digital signature embedding requires additional tooling (e.g., signpdf)
                // The image signature above provides the visual proof; P12 metadata is logged.
              }
            } catch (p12Err) {
              console.error('[SignatureAccept] P12 certificate processing failed (non-fatal):', p12Err);
            }
          }

          // Determine output path
          const pdfDir = path.dirname(pdfAbsPath);
          const pdfBaseName = path.basename(pdfAbsPath, '.pdf');
          const signedFileName = `${pdfBaseName}_signe.pdf`;
          const signedAbsPath = path.join(pdfDir, signedFileName);

          fs.writeFileSync(signedAbsPath, finalPdfBytes);

          // Derive public URL
          const publicDir = path.join(process.cwd(), 'public');
          signedPdfPublicPath = '/' + path.relative(publicDir, signedAbsPath).replace(/\\/g, '/');

          console.log('[SignatureAccept] Signed PDF saved to', signedAbsPath);
        }
      } catch (signingErr) {
        console.error('[SignatureAccept] PDF signing failed (non-fatal):', signingErr);
      }
    }

    // Update occupation: aotFinalPath + aotSigned + advance statut
    const nextStatusMap: Record<string, string> = {
      'INIT': 'INST',
      'INST': 'PREP',
      'PREP': 'EN_COURS',
      'EN_COURS': 'VALIDE',
    };
    const currentStatut = signatureRequest.occupation.statut;
    const nextStatut = nextStatusMap[currentStatut];

    await prisma.occupation.update({
      where: { id: signatureRequest.occupation.id },
      data: {
        ...(signedPdfPublicPath ? { aotFinalPath: signedPdfPublicPath } : {}),
        aotSigned: true,
        ...(nextStatut ? { statut: nextStatut } : {}),
      }
    });

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

    // Notifier le demandeur
    try {
      const reqLogin = (signatureRequest as any).requestedByLogin;
      if (reqLogin && reqLogin !== 'admin') {
        const userRows = await (prisma as any).$queryRaw`
          SELECT email, prenom, nom FROM "User" WHERE login = ${reqLogin} LIMIT 1
        `;
        const requester = (userRows as any[])[0];
        if (requester?.email) {
          const signedAtStr = now.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          const appSettings = await (prisma as any).$queryRaw`SELECT appUrl FROM AppSettings WHERE id = 1`;
          const baseUrl = ((appSettings as any[])[0]?.appUrl || 'http://localhost:3000').replace(/\/$/, '');
          const lienDossier = `${baseUrl}/dashboard/occupations/${signatureRequest.occupation.id}`;
          const tiersNom = (signatureRequest.occupation as any).tiers?.nom || `Dossier #${signatureRequest.occupation.id}`;
          const dateDebut = (signatureRequest.occupation as any).dateDebut ? new Date((signatureRequest.occupation as any).dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          const dateFin = (signatureRequest.occupation as any).dateFin ? new Date((signatureRequest.occupation as any).dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          const { html: emailHtml, subject: emailSubject } = await getContextualMessageData('MSG_AOT_SIGNE', {
            DEMANDEUR: `${requester.prenom} ${requester.nom}`.trim() || reqLogin,
            TIERS: tiersNom,
            LIEN_DOSSIER: lienDossier,
            SIGNATAIRE: signatureRequest.signatory.nom,
            DATE_SIGNATURE: signedAtStr,
            'tiers.nom': tiersNom,
            adresse: (signatureRequest.occupation as any).adresse || '',
            dateDebut: dateDebut,
            dateFin: dateFin,
          });
          await sendApmMail(requester.email, emailSubject || `✅ AOT signé — ${tiersNom}`, emailHtml);
        }
      }
    } catch (notifErr) {
      console.warn('[Accept] Notification demandeur échouée:', notifErr);
    }

    // Add automatic note for signature acceptance
    try {
      const year = signatureRequest.occupation.anneeTaxation || new Date().getFullYear();
      const noteContent = `✅ Document signé par ${signatureRequest.signatory.nom} et statut avancé à ${nextStatut || signatureRequest.occupation.statut} (${year})`;
      await (prisma as any).note.create({
        data: {
          occupationId: signatureRequest.occupation.id,
          content: noteContent,
          author: 'Système',
          isEmail: false,
          origin: 'desktop',
          created_at: now
        }
      });
    } catch (noteError) {
      console.error('[Accept] Failed to create note:', noteError);
    }

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      signedAt: signatureRequest.signedAt?.toISOString(),
      signedDocumentPath: signedPdfPublicPath
    });
  } catch (error: any) {
    console.error('[POST /api/signature/[token]/accept]', error);
    return NextResponse.json(
      { error: 'Failed to sign document' },
      { status: 500 }
    );
  }
}
