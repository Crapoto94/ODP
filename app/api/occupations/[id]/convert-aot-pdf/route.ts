import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

/**
 * Résout le chemin binaire de LibreOffice selon la plateforme.
 * - Linux / Docker : `libreoffice` (dans le PATH)
 * - Windows       : cherche soffice.exe dans les emplacements habituels
 */
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
 * Convertit un fichier DOCX en PDF via LibreOffice headless.
 * Utilise spawnSync avec shell:false → pas de cmd.exe → pas bloqué par l'AV.
 * Retourne le chemin absolu du PDF généré.
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
    throw new Error(`LibreOffice introuvable ou erreur de lancement : ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || '';
    throw new Error(`LibreOffice a échoué (code ${result.status}) : ${stderr}`);
  }
  if (!fs.existsSync(pdfAbsPath)) {
    throw new Error('Conversion PDF échouée : le fichier de sortie n\'a pas été créé');
  }

  return pdfAbsPath;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  try {
    const occ = await prisma.occupation.findUnique({ where: { id } });
    if (!occ) {
      return NextResponse.json({ error: 'Occupation introuvable' }, { status: 404 });
    }

    const aotPath = occ.aotFinalPath;
    if (!aotPath) {
      return NextResponse.json({ error: 'Aucun document AOT' }, { status: 400 });
    }

    if (!aotPath.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ url: aotPath, alreadyPdf: true });
    }

    const docxAbsPath = path.join(process.cwd(), 'public', aotPath.replace(/^\//, ''));

    if (!fs.existsSync(docxAbsPath)) {
      return NextResponse.json({ error: `Fichier introuvable : ${docxAbsPath}` }, { status: 404 });
    }

    const pdfAbsPath = convertDocxToPdf(docxAbsPath);
    const pdfRelUrl = '/' + path.relative(path.join(process.cwd(), 'public'), pdfAbsPath).replace(/\\/g, '/');

    await prisma.occupation.update({
      where: { id },
      data: { aotFinalPath: pdfRelUrl },
    });

    return NextResponse.json({ url: pdfRelUrl });
  } catch (err: any) {
    console.error('[convert-aot-pdf]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
