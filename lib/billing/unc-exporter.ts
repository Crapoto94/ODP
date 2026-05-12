import { join } from 'path';
import { existsSync } from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { promisify } from 'util';
const SMB2 = require('smb2');
import { BillingResult } from './filien-preparator';

// Helper to remove accents and replace spaces with underscores
function cleanFilename(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

// Helper to remove year suffix from dossier name (e.g., "TEST_2023" -> "TEST")
function removeYearSuffix(name: string): string {
  return name.replace(/_\d{4}$/, '').replace(/-\d{4}$/, '');
}

export async function exportToUnc(params: {
  uncDir: string;
  runName: string;
  filienContent: string;
  filienFilename: string;
  results: BillingResult[];
  tlpeConfig: any;
  odpConfigs: Record<number, any>;
  recapFilename?: string;
  recapPath?: string;
  facturesDir: string;
  appSettings?: any;
  dossiers?: any[];
}): Promise<boolean> {
  const { uncDir, runName, filienContent, filienFilename, results, tlpeConfig, odpConfigs, recapFilename, recapPath, facturesDir, appSettings, dossiers } = params;
  const publicPath = join(process.cwd(), 'public');
  
  try {
    if (appSettings?.filienUncUser && appSettings?.filienUncPass) {
      return await exportViaSmb(params, publicPath);
    } else {
      return await exportViaLocalFs(params, publicPath);
    }
  } catch (err) {
    console.error('[UNC EXPORT ERROR]', err);
    return false;
  }
}

async function exportViaSmb(params: any, publicPath: string) {
  const { uncDir, runName, filienContent, filienFilename, results, tlpeConfig, odpConfigs, recapFilename, recapPath, facturesDir, appSettings, dossiers } = params;
  
  const normalizedPath = uncDir.replace(/\//g, '\\');
  const parts = normalizedPath.split('\\').filter(Boolean);
  if (parts.length < 2) throw new Error("Format UNC invalide");
  
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

  const targetSubDir = remainingPath ? join(remainingPath, runName) : runName;
  
  // Ensure directories exist
  const pathParts = targetSubDir.split(/[\\/]/).filter(Boolean);
  let currentPath = '';
  for (const part of pathParts) {
    currentPath = currentPath ? join(currentPath, part) : part;
    if (!await smbExists(currentPath).catch(() => false)) {
      await smbMkdir(currentPath).catch((err: any) => {
        if (err.code !== 'STATUS_OBJECT_NAME_COLLISION') throw err;
      });
    }
  }

  // Copy Files
  for (const res of results) {
    const pdfName = `${res.numero}.pdf`;
    let source = res.path ? (res.path.startsWith('/') ? join(publicPath, res.path) : res.path) : join(facturesDir, pdfName);
    if (existsSync(source)) await smbWriteFile(join(targetSubDir, pdfName), await readFile(source));

    const occ = res?.id ? dossiers?.find((d: any) => d.id === res.id) : null;
    console.log(`[EXPORT] Dossier ${res.id} (${occ?.nom}):`, { aotFinalPath: occ?.aotFinalPath, dateDebut: occ?.dateDebut, anneeTaxation: occ?.anneeTaxation });

    if (occ?.aotFinalPath) {
      const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
      const aotYear = occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : (occ.anneeTaxation || new Date().getFullYear());
      const ext = occ.aotFinalPath.split('.').pop();
      const baseName = occ?.nom ? removeYearSuffix(occ.nom) : `Dossier_${occ?.id}`;
      const newName = cleanFilename(`AOT_${baseName}_${aotYear}.${ext}`);
      console.log(`[EXPORT] AOT path: ${aotSrc}, exists: ${existsSync(aotSrc)}, newName: ${newName}`);
      if (existsSync(aotSrc)) {
        await smbWriteFile(join(targetSubDir, newName), await readFile(aotSrc));
        console.log(`[EXPORT] AOT copied successfully`);
      } else {
        console.warn(`[EXPORT] AOT file not found at: ${aotSrc}`);
      }
    } else {
      console.warn(`[EXPORT] No AOT for dossier ${res.id}`);
    }
  }

  if (recapPath && existsSync(recapPath)) await smbWriteFile(join(targetSubDir, recapFilename!), await readFile(recapPath));
  await smbWriteFile(join(targetSubDir, filienFilename), Buffer.from(filienContent, 'latin1'));

  // Copy Regulatory docs with renamed filenames
  const configs = [...(tlpeConfig ? [{cfg: tlpeConfig, isOdp: false, annee: new Date().getFullYear()}] : []), ...Object.entries(odpConfigs || {}).map(([annee, cfg]: [string, any]) => ({cfg, isOdp: true, annee: parseInt(annee)}))];
  for (const {cfg, isOdp, annee} of configs) {
    if (cfg.deliberationPath) {
      const src = cfg.deliberationPath.startsWith('/') ? join(publicPath, cfg.deliberationPath) : cfg.deliberationPath;
      const ext = cfg.deliberationPath.split('.').pop();
      const newName = cleanFilename(`Deliberation_${annee}.${ext}`);
      if (existsSync(src)) {
        await smbWriteFile(join(targetSubDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT SMB] Deliberation not found at ${src}, creating stub`);
        await smbWriteFile(join(targetSubDir, newName), Buffer.from(`Délibération ${annee} - Document generated for Filien export`));
      }
    }
    const tPath = isOdp ? cfg.tarifsOdpPath : cfg.tarifsPath;
    if (tPath) {
      const src = tPath.startsWith('/') ? join(publicPath, tPath) : tPath;
      const ext = tPath.split('.').pop();
      const newName = cleanFilename(isOdp ? `Tarifs_ODP_${annee}.${ext}` : `Tarifs_${annee}.${ext}`);
      if (existsSync(src)) {
        await smbWriteFile(join(targetSubDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT SMB] Tarifs not found at ${src}, creating stub`);
        await smbWriteFile(join(targetSubDir, newName), Buffer.from(`Tarifs ${annee} - Document generated for Filien export`));
      }
    }
    if (isOdp && cfg.tarifsTournagesPath) {
      const src = cfg.tarifsTournagesPath.startsWith('/') ? join(publicPath, cfg.tarifsTournagesPath) : cfg.tarifsTournagesPath;
      const ext = cfg.tarifsTournagesPath.split('.').pop();
      const newName = cleanFilename(`Tarifs_Tournages_${annee}.${ext}`);
      if (existsSync(src)) {
        await smbWriteFile(join(targetSubDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT SMB] Tarifs Tournages not found at ${src}, creating stub`);
        await smbWriteFile(join(targetSubDir, newName), Buffer.from(`Tarifs Tournages ${annee} - Document generated for Filien export`));
      }
    }
  }

  return true;
}

async function exportViaLocalFs(params: any, publicPath: string) {
  const { uncDir, runName, filienContent, filienFilename, results, tlpeConfig, odpConfigs, recapFilename, recapPath, facturesDir, dossiers } = params;
  const targetDir = join(uncDir, runName);
  if (!existsSync(targetDir)) await mkdir(targetDir, { recursive: true });

  for (const res of results) {
    const pdfName = `${res.numero}.pdf`;
    let source = res.path ? (res.path.startsWith('/') ? join(publicPath, res.path) : res.path) : join(facturesDir, pdfName);
    if (existsSync(source)) await writeFile(join(targetDir, pdfName), await readFile(source));

    const occ = res?.id ? dossiers?.find((d: any) => d.id === res.id) : null;
    if (occ?.aotFinalPath) {
      const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
      const aotYear = occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : (occ.anneeTaxation || new Date().getFullYear());
      const ext = occ.aotFinalPath.split('.').pop();
      const baseName = occ?.nom ? removeYearSuffix(occ.nom) : `Dossier_${occ?.id}`;
      const newName = cleanFilename(`AOT_${baseName}_${aotYear}.${ext}`);
      console.log(`[EXPORT LOCAL] AOT for ${occ?.id}: ${occ?.aotFinalPath} -> ${newName}`);
      if (existsSync(aotSrc)) await writeFile(join(targetDir, newName), await readFile(aotSrc));
    }
  }

  if (recapPath && existsSync(recapPath)) await writeFile(join(targetDir, recapFilename!), await readFile(recapPath));
  await writeFile(join(targetDir, filienFilename), Buffer.from(filienContent, 'latin1'));

  const configs = [...(tlpeConfig ? [{cfg: tlpeConfig, isOdp: false, annee: new Date().getFullYear()}] : []), ...Object.entries(odpConfigs || {}).map(([annee, cfg]: [string, any]) => ({cfg, isOdp: true, annee: parseInt(annee)}))];
  for (const {cfg, isOdp, annee} of configs) {
    if (cfg.deliberationPath) {
      const src = cfg.deliberationPath.startsWith('/') ? join(publicPath, cfg.deliberationPath) : cfg.deliberationPath;
      const ext = cfg.deliberationPath.split('.').pop();
      const newName = cleanFilename(`Deliberation_${annee}.${ext}`);
      if (existsSync(src)) {
        await writeFile(join(targetDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT LOCAL] Deliberation not found at ${src}, creating stub`);
        await writeFile(join(targetDir, newName), Buffer.from(`Délibération ${annee} - Document generated for Filien export`));
      }
    }
    const tPath = isOdp ? cfg.tarifsOdpPath : cfg.tarifsPath;
    if (tPath) {
      const src = tPath.startsWith('/') ? join(publicPath, tPath) : tPath;
      const ext = tPath.split('.').pop();
      const newName = cleanFilename(isOdp ? `Tarifs_ODP_${annee}.${ext}` : `Tarifs_${annee}.${ext}`);
      if (existsSync(src)) {
        await writeFile(join(targetDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT LOCAL] Tarifs not found at ${src}, creating stub`);
        await writeFile(join(targetDir, newName), Buffer.from(`Tarifs ${annee} - Document generated for Filien export`));
      }
    }
    if (isOdp && cfg.tarifsTournagesPath) {
      const src = cfg.tarifsTournagesPath.startsWith('/') ? join(publicPath, cfg.tarifsTournagesPath) : cfg.tarifsTournagesPath;
      const ext = cfg.tarifsTournagesPath.split('.').pop();
      const newName = cleanFilename(`Tarifs_Tournages_${annee}.${ext}`);
      if (existsSync(src)) {
        await writeFile(join(targetDir, newName), await readFile(src));
      } else {
        // Create stub file if source doesn't exist (dev mode)
        console.warn(`[EXPORT LOCAL] Tarifs Tournages not found at ${src}, creating stub`);
        await writeFile(join(targetDir, newName), Buffer.from(`Tarifs Tournages ${annee} - Document generated for Filien export`));
      }
    }
  }

  return true;
}
