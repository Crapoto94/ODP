import { join } from 'path';
import { statfs, mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const SMB2 = require('smb2');

const execFileAsync = promisify(execFile);

export interface RepoConfig {
  path: string;
  user: string;
  password: string;
  domain: string;
}

export interface RepoTestResult {
  success: boolean;
  mode: 'smb' | 'local' | 'none';
  message: string;
}

export interface DiskSpaceInfo {
  root: string;
  mode: 'smb' | 'local';
  total: number;
  free: number;
  used: number;
  percentFree: number;
  totalHuman: string;
  freeHuman: string;
  usedHuman: string;
}

function normalizeWindows(p: string): string {
  return String(p || '').replace(/\//g, '\\');
}

function isUncPath(p: string): boolean {
  return /^\\\\[^\\]+\\[^\\]+/.test(normalizeWindows(p));
}

function parseUnc(p: string) {
  const parts = normalizeWindows(p).split('\\').filter(Boolean);
  if (parts.length < 2) {
    throw new Error('Format UNC invalide (attendu \\\\serveur\\partage[\\sous-dossier]).');
  }
  return { server: parts[0], share: parts[1], basePrefix: parts.slice(2).join('\\') };
}

function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: value >= 100 ? 0 : 1 })} ${units[i]}`;
}

function formatError(err: any): string {
  const code: string = err?.code || '';
  const msg: string = err?.message || String(err);
  if (/STATUS_LOGON_FAILURE/i.test(msg)) return 'Authentification refusée : login ou mot de passe incorrect.';
  if (/STATUS_ACCESS_DENIED/i.test(msg)) return 'Accès refusé : le compte n\'a pas les droits en écriture sur ce partage.';
  if (/STATUS_OBJECT_NAME_NOT_FOUND|STATUS_PATH_NOT_FOUND/i.test(msg)) return 'Dossier introuvable sur le partage réseau.';
  if (/STATUS_OBJECT_NAME_COLLISION/i.test(msg)) return 'Conflit de nom sur le partage réseau.';
  if (code === 'ECONNREFUSED') return 'Connexion refusée : le serveur n\'est pas accessible.';
  if (code === 'ENOTFOUND') return 'Serveur introuvable : vérifiez le nom d\'hôte du dépôt.';
  if (code === 'ETIMEDOUT' || code === 'ECONNABORTED' || /timed out/i.test(msg)) return 'Timeout : le serveur est inaccessible ou trop lent.';
  if (code === 'ENOENT') return 'Dossier introuvable : le chemin n\'existe pas ou n\'est pas accessible.';
  if (code === 'EACCES' || code === 'EPERM') return 'Permissions insuffisantes sur ce dossier.';
  if (code === 'ENETUNREACH') return 'Réseau injoignable pour ce serveur.';
  return msg || 'Erreur inconnue.';
}

function makeSmbClient(config: RepoConfig) {
  const { server, share } = parseUnc(config.path);
  return new SMB2({
    share: `\\\\${server}\\${share}`,
    domain: config.domain || 'WORKGROUP',
    username: config.user,
    password: config.password,
  });
}

async function smbWriteTest(config: RepoConfig) {
  const client = makeSmbClient(config);
  const smbMkdir = promisify(client.mkdir.bind(client));
  const smbWriteFile = promisify(client.writeFile.bind(client));
  const smbExists = promisify(client.exists.bind(client));
  const smbUnlink = promisify(client.unlink.bind(client));
  try {
    const { basePrefix } = parseUnc(config.path);
    const dirParts = basePrefix.split('\\').filter(Boolean);
    let current = '';
    for (const part of dirParts) {
      current = current ? join(current, part) : part;
      if (!(await smbExists(current).catch(() => false))) {
        await smbMkdir(current).catch((err: any) => {
          if (err.code !== 'STATUS_OBJECT_NAME_COLLISION') throw err;
        });
      }
    }
    const target = basePrefix
      ? join(basePrefix, `.odp_test_${Date.now()}.tmp`)
      : `.odp_test_${Date.now()}.tmp`;
    await smbWriteFile(target, Buffer.from('ok'));
    try { await smbUnlink(target); } catch (e) { /* cleanup best-effort */ }
    return true;
  } catch (err) {
    throw err;
  } finally {
    try { client.close(); } catch (e) { /* ignore */ }
  }
}

async function localWriteTest(path: string) {
  await mkdir(path, { recursive: true });
  const target = join(path, `.odp_test_${Date.now()}.tmp`);
  await writeFile(target, Buffer.from('ok'));
  try { await unlink(target); } catch (e) { /* cleanup best-effort */ }
}

export async function testRepoAccess(config: RepoConfig): Promise<RepoTestResult> {
  if (!config.path || !String(config.path).trim()) {
    return { success: false, mode: 'none', message: 'Aucun chemin de dépôt configuré.' };
  }
  const path = normalizeWindows(String(config.path).trim());
  const useSmb = isUncPath(path) && !!(config.user && config.password);
  try {
    if (useSmb) {
      await smbWriteTest({ ...config, path });
      return { success: true, mode: 'smb', message: `Connexion SMB : accès en écriture confirmé sur ${path}` };
    }
    await localWriteTest(path);
    return { success: true, mode: 'local', message: `Accès local : dossier accessible en écriture (${path})` };
  } catch (err: any) {
    return { success: false, mode: useSmb ? 'smb' : 'local', message: formatError(err) };
  }
}

async function tryStatfs(p: string): Promise<DiskSpaceInfo | null> {
  try {
    const s = await statfs(p);
    const bsize = s.bsize || 1;
    const total = s.blocks * bsize;
    const free = s.bavail * bsize;
    return {
      root: p,
      mode: 'local',
      total,
      free,
      used: total - free,
      percentFree: total > 0 ? Math.round((free / total) * 100) : 0,
      totalHuman: formatBytes(total),
      freeHuman: formatBytes(free),
      usedHuman: formatBytes(total - free),
    };
  } catch (err) {
    return null;
  }
}

export async function getRepoDiskSpace(config: RepoConfig): Promise<DiskSpaceInfo | null> {
  if (!config.path || !String(config.path).trim()) return null;
  const path = normalizeWindows(String(config.path).trim());
  const isUnc = isUncPath(path);
  const useSmb = isUnc && !!(config.user && config.password);

  // Les stats d'un partage se font au niveau de la racine du partage.
  if (isUnc) {
    const { server, share } = parseUnc(path);
    const shareRoot = `\\\\${server}\\${share}`;
    // Best effort : crée le sous-dossier configuré (idempotent, comme au moment de la facturation)
    if (useSmb) {
      const client = makeSmbClient(config);
      const smbMkdir = promisify(client.mkdir.bind(client));
      const smbExists = promisify(client.exists.bind(client));
      const { basePrefix } = parseUnc(path);
      try {
        let current = '';
        for (const part of basePrefix.split('\\').filter(Boolean)) {
          current = current ? join(current, part) : part;
          if (!(await smbExists(current).catch(() => false))) {
            await smbMkdir(current).catch((err: any) => {
              if (err.code !== 'STATUS_OBJECT_NAME_COLLISION') throw err;
            });
          }
        }
      } catch (e) { /* best-effort */ } finally {
        try { client.close(); } catch (e2) { /* ignore */ }
      }
    }

    let info = await tryStatfs(shareRoot);
    if (info) return { ...info, mode: useSmb ? 'smb' : 'local' };

    // Windows : mappe temporairement le partage avec les identifiants SMB puis relit l'espace libre.
    if (useSmb && process.platform === 'win32') {
      try {
        const cred = config.domain ? `${config.domain}\\${config.user}` : config.user;
        await execFileAsync('net', ['use', shareRoot, config.password, '/user:' + cred, '/persistent:no'], { windowsHide: true, timeout: 20000 });
        info = await tryStatfs(shareRoot);
        try { await execFileAsync('net', ['use', shareRoot, '/delete', '/y'], { windowsHide: true, timeout: 10000 }); } catch (e) { /* ignore */ }
        if (info) return { ...info, mode: 'smb' };
      } catch (err) {
        console.error('[REPO DISK] net use du partage impossible:', formatError(err));
      }
    }
    return null;
  }

  // Chemin local : on crée le dossier s'il n'existe pas puis on lit l'espace libre.
  try { await mkdir(path, { recursive: true }); } catch (e) { /* best-effort */ }
  let info = await tryStatfs(path);
  if (!info && existsSync(path)) {
    let parent = path;
    while (parent && !info) {
      parent = parent.includes('\\') ? parent.replace(/\\[^\\]+$/, '') : '';
      if (!parent) break;
      info = await tryStatfs(parent);
    }
  }
  return info ? { ...info, root: path, mode: 'local' } : null;
}