import { join } from 'path';
import { statfs, mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const SMB2 = require('smb2');
require('./smb-statfs'); // Ajoute SMB2.prototype.statfs (QUERY_INFO / FileFsFullSizeInformation)

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
  if (code === 'EISCONN') return 'Connexion déjà établie puis interrompue : vérifiez l\'identifiant/mot de passe SMB du dépôt.';
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

// Espace libre lu directement auprès du serveur SMB (protocole SMB2), via
// `SMB2.prototype.statfs` ajouté par ./smb-statfs. C'est la méthode qui
// fonctionne aussi bien sous Linux (prod Docker) que sous Windows.
async function trySmbSpace(config: RepoConfig): Promise<DiskSpaceInfo | null> {
  const { basePrefix } = parseUnc(config.path);
  // Une seule tentative : ouvrir le sous-dossier configuré (créé au dépôt),
  // sinon la racine du partage. Évite de multiplier les authentifications
  // (risque de verrouillage du compte de service).
  const target = normalizeWindows(basePrefix || '');
  const client: any = makeSmbClient(config);
  const statfsAsync = promisify(client.statfs.bind(client));
  try {
    const info: any = await statfsAsync(target);
    const total = Number(info?.total);
    const free = Number(info?.free);
    if (!isFinite(total) || total <= 0) throw new Error('Espace total invalide retourné par le serveur SMB.');
    const used = Math.max(0, total - free);
    return {
      root: `\\\\${parseUnc(config.path).server}\\${parseUnc(config.path).share}`,
      mode: 'smb',
      total,
      free,
      used,
      percentFree: Math.round((free / total) * 100),
      totalHuman: formatBytes(total),
      freeHuman: formatBytes(free),
      usedHuman: formatBytes(used),
    };
  } catch (err) {
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : '';
    console.warn(`[REPO DISK] SMB statfs (${target || '.'}) échoué:`, formatError(err), stack);
    return null;
  } finally {
    try { client.close(); } catch (e) { /* ignore */ }
  }
}

// Mappe temporairement le partage Windows sur une lettre de lecteur libre avec
// `net use`, lit l'espace libre via WMI puis nettoie. Essaie d'abord le compte
// avec son domaine puis sans domaine (comptes locaux NAS / WORKGROUP).
//
// C'est la méthode la plus fiable en prod : statfs/Get-PSDrive ne remontent pas
// l'espace libre des partages SMB sans session OS préalable, et New-PSDrive
// seul renvoie des valeurs vides pour les lecteurs non persistés.
async function tryNetUseSpace(config: RepoConfig, shareRoot: string): Promise<DiskSpaceInfo | null> {
  if (process.platform !== 'win32') return null;
  const creds: string[] = [];
  if (config.domain && config.domain.trim().toLowerCase() !== 'workgroup') {
    creds.push(`${config.domain}\\${config.user}`);
  }
  creds.push(config.user);

  const script = [
    "$used = (Get-PSDrive -PSProvider FileSystem).Name -replace ':', ''",
    "$letter = $null",
    "foreach ($l in 'ZYXWVUTSRQPONMLKJIHGFEDCBA') {",
    "  if ($used -notcontains $l) { $letter = $l; break }",
    "}",
    "if (-not $letter) { [Console]::Out.WriteLine('NO_LETTER'); exit }",
    "$drive = $letter + ':'",
    "& net.exe use $drive $env:ODP_SMB_ROOT $env:ODP_SMB_PASS /user:$env:ODP_SMB_USER /persistent:no 2>&1 | Out-Null",
    "if ($LASTEXITCODE -ne 0) {",
    "  [Console]::Out.WriteLine('NETUSE_FAIL')",
    "  exit",
    "}",
    "$disk = Get-CimInstance Win32_LogicalDisk -Filter (\"DeviceID='\" + $drive + \"'\") -ErrorAction SilentlyContinue",
    "$free = $null; $size = $null",
    "if ($disk) { $free = $disk.FreeSpace; $size = $disk.Size }",
    "& net.exe use $drive /delete /y 2>&1 | Out-Null",
    "if ($free -ne $null -and $size -ne $null) {",
    '  [Console]::Out.WriteLine("OK " + $free + " " + $size)',
    "} else {",
    "  [Console]::Out.WriteLine('WMI_FAIL')",
    "}",
  ].join('\n');

  for (const cred of creds) {
    try {
      const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
        env: {
          ...(process.env as any),
          ODP_SMB_USER: cred,
          ODP_SMB_PASS: config.password,
          ODP_SMB_ROOT: shareRoot,
        },
        windowsHide: true,
        timeout: 45000,
      });
      const line = stdout.split(/\r?\n/).find(l => l.startsWith('OK '));
      if (line) {
        const [, freeStr, sizeStr] = line.split(/\s+/);
        const free = parseFloat(freeStr);
        const total = parseFloat(sizeStr);
        const used = total - free;
        if (isFinite(free) && isFinite(total) && total > 0) {
          return {
            root: shareRoot,
            mode: 'smb',
            total,
            free,
            used,
            percentFree: Math.round((free / total) * 100),
            totalHuman: formatBytes(total),
            freeHuman: formatBytes(free),
            usedHuman: formatBytes(used),
          };
        }
      }
      console.warn(`[REPO DISK] net use / WMI (${cred}) KO:`, stdout.trim().split('\n').pop() || stdout.trim());
    } catch (err) {
      console.warn(`[REPO DISK] net use (${cred}) échoué:`, (err as any)?.message || err);
    }
  }
  return null;
}

// Interroge l'espace libre d'un partage SMB via disque mappé (`net use`).

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

    let info: DiskSpaceInfo | null = null;

    // Méthode privilégiée : interrogation SMB2 auprès du serveur (fonctionne
    // sous Linux prod comme sous Windows), cohérente avec le compte utilisé
    // pour déposer les fichiers.
    if (useSmb) {
      info = await trySmbSpace(config);
      if (info) return info;
    }

    // Repli Windows : disque mappé `net use` + WMI (statfs UNC étant erroné).
    if (useSmb && process.platform === 'win32') {
      info = await tryNetUseSpace(config, shareRoot);
      if (info) return info;
    }

    info = await tryStatfs(shareRoot);
    if (info) return { ...info, mode: useSmb ? 'smb' : 'local' };

    console.error('[REPO DISK] Espace libre du partage indisponible (SMB / statfs / net use échoués).');
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