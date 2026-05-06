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

  const rawStart = appSettings?.filienMouvement || '1';
  const match = rawStart.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : '';
  const numStr = match ? match[2] : rawStart;
  const startNum = parseInt(numStr) || 1;
  const padding = numStr.length;

  return results.map((r, idx) => {
    const occ = dossiers.find((d: any) => d.id === r.id);
    const attachments = [];
    const mouvementId = prefix + (startNum + idx).toString().padStart(padding, '0');

    // 1. Délibération (PJ1 - /26/)
    if (tlpeConfig?.deliberationPath) {
      const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
      attachments.push({
        name: 'Délibération',
        filename: delibName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, delibName) : tlpeConfig.deliberationPath,
      });
    }

    // 2. Tarifs (PJ2 - /27/)
    const tarifsPath = tlpeConfig?.tarifsOdpPath || tlpeConfig?.tarifsPath;
    if (tarifsPath) {
      const tarifsName = tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
      attachments.push({
        name: 'Tarifs',
        filename: tarifsName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, tarifsName) : tarifsPath,
      });
    }

    // 3. AOT (PJ3 - /28/)
    if (occ?.aotFinalPath) {
      const aotName = occ.aotFinalPath.split(/[\\/]/).pop() || `AOT_${occ.id}.pdf`;
      attachments.push({
        name: 'AOT',
        filename: aotName,
        supportType: '01',
        path: runUncPath ? join(runUncPath, aotName) : occ.aotFinalPath,
      });
    }

    // 4. Détails de facture (PJ4 - /29/)
    attachments.push({
      name: 'Détails de facture',
      filename: `${r.numero}.pdf`,
      supportType: '01',
      path: runUncPath ? join(runUncPath, `${r.numero}.pdf`) : r.path,
    });

    return {
      id: mouvementId,
      type: appSettings?.filienType || 'R',
      tiersCode: r.tiersCode || (occ?.debiteur || occ?.tiers)?.code_sedit || 'TIERS_INCONNU',
      libelle: `Chantier ${appSettings?.filienLibelle || occ?.nom || `Dossier #${occ?.id}`}`,
      calendrier: appSettings?.filienCalendrier || '01',
      monnaie: appSettings?.filienMonnaie || 'E',
      existant: appSettings?.filienMouvementEx || 'N',
      preBordereau: appSettings?.filienPreBordereau || '1235',
      poste: appSettings?.filienPoste || '0001',
      bordereau: appSettings?.filienBordereau || '0001',
      objet: appSettings?.filienObjet || '',
      attachments,
      lines: [{
        numero: 1,
        imputation: r.lignes[0]?.article?.numero || 'IMPUT_VIDE',
        montant: r.total,
        dateDebut: r.lignes[0]?.dateDebut || undefined,
        dateFin: r.lignes[0]?.dateFin || undefined,
        description: `Occupation du domaine public - ${occ?.nom || r.numero}`,
        quantite: 1,
        prixUnitaire: r.total,
        chapitre: r.lignes[0]?.article?.chapitre || '',
        nature: r.lignes[0]?.article?.nature || '',
        fonction: r.lignes[0]?.article?.fonction || '',
        codeInterne: r.lignes[0]?.article?.codeInterne || '',
        typeMouvement: r.lignes[0]?.article?.typeMouvement || '',
        sens: r.lignes[0]?.article?.sens || '',
        structure: r.lignes[0]?.article?.structure || '',
        gestionnaire: r.lignes[0]?.article?.gestionnaire || '',
      }]
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
  appSettings?: any;
  dossiers?: any[];
}): Promise<boolean> {
  const { uncDir, runName, filienContent, filienFilename, results, tlpeConfig, recapFilename, recapPath, facturesDir, appSettings, dossiers } = params;
  const publicPath = join(process.cwd(), 'public');
  
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

      // 1. Copy individual invoices & AOTs
      for (const res of results) {
        // Invoice
        const pdfName = `${res.numero}.pdf`;
        const target = join(targetSubDir, pdfName);
        let source = '';
        if (res.path) {
          source = res.path.startsWith('/') ? join(publicPath, res.path) : res.path;
        } else {
          source = join(facturesDir, pdfName);
        }

        if (source && existsSync(source)) {
          await smbWriteFile(target, await readFile(source));
        }

        // AOT
        const occ = dossiers.find((d: any) => d.id === res.id);
        if (occ?.aotFinalPath) {
          const aotName = occ.aotFinalPath.split(/[\\/]/).pop() || `AOT_${occ.id}.pdf`;
          const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
          if (existsSync(aotSrc)) {
            await smbWriteFile(join(targetSubDir, aotName), await readFile(aotSrc));
          }
        }
      }

      // 2. Copy Recap PDF
      if (recapFilename && recapPath && existsSync(recapPath)) {
        await smbWriteFile(join(targetSubDir, recapFilename), await readFile(recapPath));
      }
      
      // 3. Copy Filien file
      await smbWriteFile(join(targetSubDir, filienFilename), Buffer.from(filienContent));

      // 4. Copy Regulatory documents
      if (tlpeConfig?.deliberationPath) {
        const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
        const delibSrc = tlpeConfig.deliberationPath.startsWith('/') ? join(publicPath, tlpeConfig.deliberationPath) : tlpeConfig.deliberationPath;
        if (existsSync(delibSrc)) {
          await smbWriteFile(join(targetSubDir, delibName), await readFile(delibSrc));
        }
      }

      const tarifsPath = tlpeConfig?.tarifsOdpPath || tlpeConfig?.tarifsPath;
      if (tarifsPath) {
        const tarifsName = tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
        const tarifsSrc = tarifsPath.startsWith('/') ? join(publicPath, tarifsPath) : tarifsPath;
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
        // Invoice
        const pdfName = `${res.numero}.pdf`;
        const target = join(targetDir, pdfName);
        let source = '';
        if (res.path) {
          source = res.path.startsWith('/') ? join(publicPath, res.path) : res.path;
        } else {
          source = join(facturesDir, pdfName);
        }

        if (source && existsSync(source)) {
          await writeFile(target, await readFile(source));
        }

        // AOT
        const occ = dossiers.find((d: any) => d.id === res.id);
        if (occ?.aotFinalPath) {
          const aotName = occ.aotFinalPath.split(/[\\/]/).pop() || `AOT_${occ.id}.pdf`;
          const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
          if (existsSync(aotSrc)) {
            await writeFile(join(targetDir, aotName), await readFile(aotSrc));
          }
        }
      }

      if (recapFilename && recapPath && existsSync(recapPath)) {
        await writeFile(join(targetDir, recapFilename), await readFile(recapPath));
      }
      
      await writeFile(join(targetDir, filienFilename), filienContent);

      if (tlpeConfig?.deliberationPath) {
        const delibName = tlpeConfig.deliberationPath.split(/[\\/]/).pop() || 'Deliberation.pdf';
        const delibSrc = tlpeConfig.deliberationPath.startsWith('/') ? join(publicPath, tlpeConfig.deliberationPath) : tlpeConfig.deliberationPath;
        if (existsSync(delibSrc)) {
          await writeFile(join(targetDir, delibName), await readFile(delibSrc));
        }
      }

      const tarifsPath = tlpeConfig?.tarifsOdpPath || tlpeConfig?.tarifsPath;
      if (tarifsPath) {
        const tarifsName = tarifsPath.split(/[\\/]/).pop() || 'Tarifs.pdf';
        const tarifsSrc = tarifsPath.startsWith('/') ? join(publicPath, tarifsPath) : tarifsPath;
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
