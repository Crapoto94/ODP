import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignatureToken } from '@/lib/signature-token';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Convert a DOCX to PDF using PowerShell + Word COM automation.
 * Returns the absolute path to the generated PDF.
 */
function convertDocxToPdf(docxAbsPath: string): string {
  const pdfAbsPath = docxAbsPath.replace(/\.docx$/i, '.pdf');

  if (fs.existsSync(pdfAbsPath)) {
    return pdfAbsPath;
  }

  const psScript = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("${docxAbsPath.replace(/\\/g, '\\\\')}")
$doc.SaveAs([ref] "${pdfAbsPath.replace(/\\/g, '\\\\')}", [ref] 17)
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
`.trim();

  execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"')}"`, {
    timeout: 60000,
    windowsHide: true
  });

  if (!fs.existsSync(pdfAbsPath)) {
    throw new Error('PDF conversion failed: output file not created');
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

    // If already a PDF, return directly
    if (!aotFinalPath.toLowerCase().endsWith('.docx')) {
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
