import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

/**
 * Résout le chemin binaire de LibreOffice selon la plateforme.
 * - Linux / Docker : `libreoffice` (dans le PATH)
 * - Windows       : cherche soffice.exe dans les emplacements habituels
 */
export function getLibreOfficeBin(): string {
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
export function convertDocxToPdf(docxAbsPath: string): string {
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

/** Convertit un chemin public relatif ("/x/y.docx") en URL PDF publique ("/x/y.pdf"). */
export function publicDocxToPdf(publicRelPath: string): string {
  const docxAbsPath = path.join(process.cwd(), 'public', publicRelPath.replace(/^\//, ''));
  if (!fs.existsSync(docxAbsPath)) {
    throw new Error(`Fichier introuvable : ${docxAbsPath}`);
  }
  const pdfAbsPath = convertDocxToPdf(docxAbsPath);
  return '/' + path.relative(path.join(process.cwd(), 'public'), pdfAbsPath).replace(/\\/g, '/');
}
