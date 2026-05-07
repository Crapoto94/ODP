import { join } from 'path';
import { existsSync } from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { promisify } from 'util';
const SMB2 = require('smb2');
import { BillingResult } from './filien-preparator';

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

    const occ = dossiers?.find((d: any) => d.id === res.id);
    if (occ?.aotFinalPath) {
      const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
      if (existsSync(aotSrc)) await smbWriteFile(join(targetSubDir, occ.aotFinalPath.split(/[\\/]/).pop()!), await readFile(aotSrc));
    }
  }

  if (recapPath && existsSync(recapPath)) await smbWriteFile(join(targetSubDir, recapFilename!), await readFile(recapPath));
  await smbWriteFile(join(targetSubDir, filienFilename), Buffer.from(filienContent, 'latin1'));

  // Copy Regulatory docs
  const configs = [...(tlpeConfig ? [{cfg: tlpeConfig, isOdp: false}] : []), ...Object.values(odpConfigs || {}).map(cfg => ({cfg, isOdp: true}))];
  for (const {cfg, isOdp} of configs) {
    if (cfg.deliberationPath) {
      const src = cfg.deliberationPath.startsWith('/') ? join(publicPath, cfg.deliberationPath) : cfg.deliberationPath;
      if (existsSync(src)) await smbWriteFile(join(targetSubDir, cfg.deliberationPath.split(/[\\/]/).pop()!), await readFile(src));
    }
    const tPath = isOdp ? cfg.tarifsOdpPath : cfg.tarifsPath;
    if (tPath) {
      const src = tPath.startsWith('/') ? join(publicPath, tPath) : tPath;
      if (existsSync(src)) await smbWriteFile(join(targetSubDir, tPath.split(/[\\/]/).pop()!), await readFile(src));
    }
    if (isOdp && cfg.tarifsTournagesPath) {
      const src = cfg.tarifsTournagesPath.startsWith('/') ? join(publicPath, cfg.tarifsTournagesPath) : cfg.tarifsTournagesPath;
      if (existsSync(src)) await smbWriteFile(join(targetSubDir, cfg.tarifsTournagesPath.split(/[\\/]/).pop()!), await readFile(src));
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

    const occ = dossiers?.find((d: any) => d.id === res.id);
    if (occ?.aotFinalPath) {
      const aotSrc = occ.aotFinalPath.startsWith('/') ? join(publicPath, occ.aotFinalPath) : occ.aotFinalPath;
      if (existsSync(aotSrc)) await writeFile(join(targetDir, occ.aotFinalPath.split(/[\\/]/).pop()!), await readFile(aotSrc));
    }
  }

  if (recapPath && existsSync(recapPath)) await writeFile(join(targetDir, recapFilename!), await readFile(recapPath));
  await writeFile(join(targetDir, filienFilename), Buffer.from(filienContent, 'latin1'));

  const configs = [...(tlpeConfig ? [{cfg: tlpeConfig, isOdp: false}] : []), ...Object.values(odpConfigs || {}).map(cfg => ({cfg, isOdp: true}))];
  for (const {cfg, isOdp} of configs) {
    if (cfg.deliberationPath) {
      const src = cfg.deliberationPath.startsWith('/') ? join(publicPath, cfg.deliberationPath) : cfg.deliberationPath;
      if (existsSync(src)) await writeFile(join(targetDir, cfg.deliberationPath.split(/[\\/]/).pop()!), await readFile(src));
    }
    const tPath = isOdp ? cfg.tarifsOdpPath : cfg.tarifsPath;
    if (tPath) {
      const src = tPath.startsWith('/') ? join(publicPath, tPath) : tPath;
      if (existsSync(src)) await writeFile(join(targetDir, tPath.split(/[\\/]/).pop()!), await readFile(src));
    }
    if (isOdp && cfg.tarifsTournagesPath) {
      const src = cfg.tarifsTournagesPath.startsWith('/') ? join(publicPath, cfg.tarifsTournagesPath) : cfg.tarifsTournagesPath;
      if (existsSync(src)) await writeFile(join(targetDir, cfg.tarifsTournagesPath.split(/[\\/]/).pop()!), await readFile(src));
    }
  }

  return true;
}
