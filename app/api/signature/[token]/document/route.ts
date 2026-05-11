import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

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
          // soffice.com est le binaire CLI sur Windows (pas soffice.exe)
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
    throw new Error(`LibreOffice erreur de lancement : ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`LibreOffice a échoué (code ${result.status}) : ${result.stderr?.toString()}`);
  }
  if (!fs.existsSync(pdfAbsPath)) {
    throw new Error('Conversion PDF échouée : fichier de sortie absent');
  }

  return pdfAbsPath;
}

/**
 * GET /api/signature/[token]/document
 * Public endpoint to get/convert the AOT document to PDF for viewing.
 * Returns JSON: { pdfUrl: "/relative/path/to.pdf" }
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
        occupation: true
      }
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 }
      );
    }

    if (new Date() > signatureRequest.tokenExpiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    const aotFinalPath = signatureRequest.occupation.aotFinalPath;
    if (!aotFinalPath) {
      return NextResponse.json(
        { error: 'No AOT final document available' },
        { status: 404 }
      );
    }

    // If already a PDF, verify the file exists before returning
    if (!aotFinalPath.toLowerCase().endsWith('.docx')) {
      const absPath = path.join(process.cwd(), 'public', aotFinalPath.replace(/^\//, ''));
      if (!fs.existsSync(absPath)) {
        return NextResponse.json(
          { error: 'Document introuvable sur le serveur. Veuillez contacter l\'administrateur pour re-téléverser le document AOT.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ pdfUrl: aotFinalPath });
    }

    // It's a DOCX — convert to PDF
    const docxAbsPath = path.join(process.cwd(), 'public', aotFinalPath.replace(/^\//, ''));

    if (!fs.existsSync(docxAbsPath)) {
      return NextResponse.json(
        { error: 'DOCX file not found on server' },
        { status: 404 }
      );
    }

    const pdfAbsPath = convertDocxToPdf(docxAbsPath);

    // Derive public URL from absolute path
    const publicDir = path.join(process.cwd(), 'public');
    const pdfRelative = '/' + path.relative(publicDir, pdfAbsPath).replace(/\\/g, '/');

    return NextResponse.json({ pdfUrl: pdfRelative });
  } catch (error: any) {
    console.error('[GET /api/signature/[token]/document]', error);
    return NextResponse.json(
      { error: 'Failed to prepare document: ' + error.message },
      { status: 500 }
    );
  }
}
