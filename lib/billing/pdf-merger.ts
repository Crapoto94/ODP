import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function mergePdfFiles(paths: string[]): Promise<Buffer | null> {
  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (const p of paths) {
    if (!p || !existsSync(p)) {
      console.warn(`[PDF MERGE] File not found, skipping: ${p}`);
      continue;
    }
    try {
      const bytes = await readFile(p);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(page => merged.addPage(page));
      totalPages += pages.length;
    } catch (e) {
      console.warn(`[PDF MERGE] Could not load ${p}:`, e);
    }
  }

  if (totalPages === 0) return null;
  return Buffer.from(await merged.save());
}
