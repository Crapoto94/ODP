import { join } from 'path';
import { existsSync } from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { promisify } from 'util';
const SMB2 = require('smb2');
export { generateFilienFile } from './filien';
import { FilienMovement, FilienParams, generateFilienFile } from './filien';

export interface BillingResult {
  id: number;
  numero: string;
  path: string;
  tiers: string;
  total: number;
  lignes: any[];
}

/**
 * Prepares the movement data structure for the Filien generation tool.
 */
export function prepareFilienMovements(
  results: BillingResult[],
  dossiers: any[], 
  appSettings: any, 
  tlpeConfig: any,
  year: number,
  runName: string
): FilienMovement[] {
  const uncBase = appSettings?.filienUncPj || '';
  // Each run gets its own subfolder in the UNC root
  const runUncPath = uncBase ? join(uncBase, runName) : '';

  return results.map((r) => {
    const occ = dossiers.find((d: any) => d.id === r.id);
    const attachments = [];

    // 1. Facture
    attachments.push({
      name: `Facture ${r.numero}`,
      supportType: '01', // Electronic
      path: runUncPath ? join(runUncPath, `${r.numero}.pdf`) : r.path,
      docType: 'MDT'
    });

    // 2. Délibération
    if (tlpeConfig?.deliberationPath) {
      const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
      attachments.push({
        name: `Délibération ${year}`,
        supportType: '01',
        path: runUncPath ? join(runUncPath, delibName) : tlpeConfig.deliberationPath,
        docType: 'MDT'
      });
    }

    // 3. Tarifs
    if (tlpeConfig?.tarifsPath) {
      const tarifsName = tlpeConfig.tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
      attachments.push({
        name: `Tarifs ${year}`,
        supportType: '01',
        path: runUncPath ? join(runUncPath, tarifsName) : tlpeConfig.tarifsPath,
        docType: 'MDT'
      });
    }

    return {
      id: r.numero.replace(/-/g, '').slice(-10),
      type: appSettings?.filienType || 'R',
      tiersCode: occ?.tiers?.code_sedit || 'TIERS_INCONNU',
      libelle: appSettings?.filienLibelle || occ?.nom || `Dossier #${occ?.id}`,
      calendrier: appSettings?.filienCalendrier || '01',
      monnaie: appSettings?.filienMonnaie || 'E',
      existant: appSettings?.filienMouvementEx || 'N',
      preBordereau: appSettings?.filienPreBordereau || '1235',
      poste: appSettings?.filienPoste || '0001',
      bordereau: appSettings?.filienBordereau || '0001',
      objet: appSettings?.filienObjet || '',
      attachments,
      lines: r.lignes.map((l: any, lIdx: number) => ({
        numero: lIdx + 1,
        imputation: l.article?.numero || 'IMPUT_VIDE',
        montant: l.calculatedTotal || l.montant,
        dateDebut: l.dateDebut || undefined,
        dateFin: l.dateFin || undefined,
        description: l.article?.designation || '',
        quantite: (l.quantite1 || 1) * (l.quantite2 || 1),
        prixUnitaire: l.article?.montant || 0,
        chapitre: l.article?.chapitre || '',
        nature: l.article?.nature || '',
        fonction: l.article?.fonction || '',
        codeInterne: l.article?.codeInterne || '',
        typeMouvement: l.article?.typeMouvement || '',
        sens: l.article?.sens || '',
        structure: l.article?.structure || '',
        gestionnaire: l.article?.gestionnaire || ''
      }))
    };
  });
}

/**
 * Handles the physical export of all relevant files to the UNC network path.
 */
export async function exportToUnc(params: {
  uncDir: string;
  runName: string;
  filienContent: string;
  filienFilename: string;
  results: BillingResult[];
  tlpeConfig: any;
  recapFilename?: string;
  recapPath?: string;
  facturesDir: string;
  appSettings?: any; // Add appSettings to params
}): Promise<boolean> {
  const { uncDir, runName, filienContent, filienFilename, results, tlpeConfig, recapFilename, recapPath, facturesDir, appSettings } = params;
  
  try {
    // If SMB credentials are provided, use SMB2
    if (appSettings?.filienUncUser && appSettings?.filienUncPass) {
      console.log(`[UNC] Attempting SMB export to ${uncDir} with user ${appSettings.filienUncUser} (Domain: ${appSettings.filienUncDomain || 'WORKGROUP'})`);
      
      // Parse UNC path: \\SERVER\SHARE\PATH
      const normalizedPath = uncDir.replace(/\//g, '\\');
      const parts = normalizedPath.split('\\').filter(Boolean);
      if (parts.length < 2) throw new Error("Format UNC invalide (attendu: \\\\serveur\\partage\\...)");
      
      const server = parts[0];
      const shareName = parts[1];
      const remainingPath = parts.slice(2).join('\\');
      
      const smbClient = new SMB2({
        share: `\\\\${server}\\${shareName}`,
        domain: appSettings.filienUncDomain || 'WORKGROUP',
        username: appSettings.filienUncUser,
        password: appSettings.filienUncPass
      });

      const smbMkdir = promisify(smbClient.mkdir.bind(smbClient));
      const smbWriteFile = promisify(smbClient.writeFile.bind(smbClient));
      const smbExists = promisify(smbClient.exists.bind(smbClient));

      // Target subfolder
      const targetSubDir = remainingPath ? join(remainingPath, runName) : runName;
      
      // Ensure directories exist recursively
      const pathParts = targetSubDir.split(/[\\/]/).filter(Boolean);
      let currentPath = '';
      for (const part of pathParts) {
        currentPath = currentPath ? join(currentPath, part) : part;
        const exists = await smbExists(currentPath).catch(() => false);
        if (!exists) {
          await smbMkdir(currentPath).catch((err: any) => {
            // Directory might already exist (race condition)
            if (err.code !== 'STATUS_OBJECT_NAME_COLLISION') throw err;
          });
        }
      }

      // 1. Copy individual invoices
      for (const res of results) {
        const pdfName = `${res.numero}.pdf`;
        const source = join(facturesDir, pdfName);
        const target = join(targetSubDir, pdfName);
        if (existsSync(source)) {
          const content = await readFile(source);
          await smbWriteFile(target, content);
        }
      }

      // 2. Copy Recap PDF
      if (recapFilename && recapPath && existsSync(recapPath)) {
        await smbWriteFile(join(targetSubDir, recapFilename), await readFile(recapPath));
      }
      
      // 3. Copy Filien file
      await smbWriteFile(join(targetSubDir, filienFilename), Buffer.from(filienContent));

      // 4. Copy Regulatory documents
      const publicPath = join(process.cwd(), 'public');
      if (tlpeConfig?.deliberationPath) {
        const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
        const delibSrc = tlpeConfig.deliberationPath.startsWith('/') ? join(publicPath, tlpeConfig.deliberationPath) : tlpeConfig.deliberationPath;
        if (existsSync(delibSrc)) {
          await smbWriteFile(join(targetSubDir, delibName), await readFile(delibSrc));
        }
      }

      if (tlpeConfig?.tarifsPath) {
        const tarifsName = tlpeConfig.tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
        const tarifsSrc = tlpeConfig.tarifsPath.startsWith('/') ? join(publicPath, tlpeConfig.tarifsPath) : tlpeConfig.tarifsPath;
        if (existsSync(tarifsSrc)) {
          await smbWriteFile(join(targetSubDir, tarifsName), await readFile(tarifsSrc));
        }
      }

      console.log(`[UNC] Successfully exported via SMB to \\\\${server}\\${shareName}\\${targetSubDir}`);
      return true;

    } else {
      // Fallback to local fs (mapped drive)
      const targetDir = join(uncDir, runName);
      if (!existsSync(targetDir)) await mkdir(targetDir, { recursive: true });

      for (const res of results) {
        const pdfName = `${res.numero}.pdf`;
        const source = join(facturesDir, pdfName);
        const target = join(targetDir, pdfName);
        if (existsSync(source)) {
          await writeFile(target, await readFile(source));
        }
      }

      if (recapFilename && recapPath && existsSync(recapPath)) {
        await writeFile(join(targetDir, recapFilename), await readFile(recapPath));
      }
      
      await writeFile(join(targetDir, filienFilename), filienContent);

      const publicPath = join(process.cwd(), 'public');
      if (tlpeConfig?.deliberationPath) {
        const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
        const delibSrc = tlpeConfig.deliberationPath.startsWith('/') ? join(publicPath, tlpeConfig.deliberationPath) : tlpeConfig.deliberationPath;
        if (existsSync(delibSrc)) {
          await writeFile(join(targetDir, delibName), await readFile(delibSrc));
        }
      }

      if (tlpeConfig?.tarifsPath) {
        const tarifsName = tlpeConfig.tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
        const tarifsSrc = tlpeConfig.tarifsPath.startsWith('/') ? join(publicPath, tlpeConfig.tarifsPath) : tlpeConfig.tarifsPath;
        if (existsSync(tarifsSrc)) {
          await writeFile(join(targetDir, tarifsName), await readFile(tarifsSrc));
        }
      }

      console.log(`[UNC] Successfully exported to ${targetDir}`);
      return true;
    }
  } catch (err) {
    console.error('[UNC EXPORT ERROR]', err);
    return false;
  }
}
