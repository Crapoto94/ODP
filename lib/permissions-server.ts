import type { Permission, Role } from './permissions';
import { ROLE_PERMISSIONS as DEFAULT_PERMISSIONS, ROLES } from './permissions';
import * as fs from 'fs';
import * as path from 'path';

type PermissionsMap = Record<string, Permission[]>;

let _cache: PermissionsMap | null = null;
let _cacheTime = 0;
const CACHE_TTL = 3000; // 3s

const CONFIG_PATH = path.join(process.cwd(), 'config', 'permissions.json');

export function loadPermissions(): PermissionsMap {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      // Les rôles absents du fichier (ajoutés depuis) reprennent leurs droits par défaut
      for (const r of ROLES) if (!saved[r]) saved[r] = DEFAULT_PERMISSIONS[r];
      _cache = saved;
      _cacheTime = now;
      return _cache!;
    }
  } catch {}
  return DEFAULT_PERMISSIONS as unknown as PermissionsMap;
}

export function hasPermissionServer(role: string, permission: Permission): boolean {
  return (loadPermissions()[role] ?? []).includes(permission);
}

export function savePermissions(newPerms: PermissionsMap): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newPerms, null, 2), 'utf8');
  _cache = newPerms;
  _cacheTime = Date.now();
}
