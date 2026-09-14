import { prisma } from '@/lib/prisma';
import { testRepoAccess, getRepoDiskSpace, RepoConfig } from './repo-checker';
import { sendApmMail } from '@/lib/apm';
import { format } from 'date-fns';

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 30 * 1000;
const RE_ALERT_DELAY_MS = 24 * 60 * 60 * 1000;
const MIN_FREE_PERCENT_DEFAULT = 10;

function getConfig(settings: any): RepoConfig | null {
  const path = settings?.filienUncPj;
  const user = settings?.filienUncUser;
  const password = settings?.filienUncPass;
  if (!path || !String(path).trim()) return null;
  return {
    path,
    user: user || '',
    password: password || '',
    domain: settings?.filienUncDomain || '',
  };
}

function buildAlertEmail(
  failure: { type: string; message?: string; disk?: any },
  config: RepoConfig
) {
  const stamp = format(new Date(), 'dd/MM/yyyy HH:mm');
  const isAccess = failure.type === 'access';
  const isSpace = failure.type === 'space';
  const isUnavail = failure.type === 'space-unavailable';

  const title = isAccess
    ? 'Accès au dépôt impossible'
    : isSpace
    ? 'Espace libre insuffisant'
    : isUnavail
    ? 'Espace libre indisponible'
    : 'Problème détecté';

  const borderColor = '#dc2626';
  const bgColor = '#fef2f2';
  const textColor = '#1f2937';
  const mutedColor = '#6b7280';

  const rows: string[] = [];

  rows.push(`<tr><td style="padding:0 0 8px"><strong style="color:${mutedColor};font-size:13px">Chemin</strong></td><td style="padding:0 0 8px;font-family:monospace;font-size:13px">${config.path}</td></tr>`);

  if (isAccess) {
    rows.push(`<tr><td style="padding:0 0 8px"><strong style="color:${mutedColor};font-size:13px">Erreur</strong></td><td style="padding:0 0 8px;font-size:13px">${failure.message || 'Inconnue'}</td></tr>`);
  }

  if (failure.disk) {
    rows.push(`<tr><td style="padding:0 0 8px"><strong style="color:${mutedColor};font-size:13px">Libre</strong></td><td style="padding:0 0 8px;font-size:13px">${failure.disk.freeHuman} / ${failure.disk.totalHuman} (${failure.disk.percentFree}%)</td></tr>`);
  }

  rows.push(`<tr><td style="padding:0 0 8px"><strong style="color:${mutedColor};font-size:13px">Date</strong></td><td style="padding:0 0 8px;font-size:13px">${stamp}</td></tr>`);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:${borderColor};color:#fff;padding:16px 24px;font-size:16px;font-weight:bold">⚠ ${title}</div>
  <div style="padding:24px;color:${textColor}">
    <p style="font-size:14px;margin:0 0 16px">Le contrôle automatique du dépôt des factures a détecté un problème :</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      ${rows.join('\n')}
    </table>
    <p style="font-size:13px;color:${mutedColor};margin:0">Vous recevez ce mail car votre adresse est renseignée comme administrateur ODP dans les paramètres.</p>
  </div>
</div>
</body>
</html>`;
}

async function sendRepoAlertEmail(
  settings: any,
  failure: { type: string; message?: string; disk?: any },
  config: RepoConfig
) {
  if (!settings?.adminEmail) {
    console.warn('[REPO-MONITOR] adminEmail non configuré — impossible d\'envoyer l\'alerte');
    return;
  }

  const label =
    failure.type === 'access' ? 'accès impossible' :
    failure.type === 'space' ? 'espace libre insuffisant' :
    failure.type === 'space-unavailable' ? 'espace libre indisponible' :
    'problème détecté';

  const subject = `[ODP] Alerte dépôt des factures — ${label}`;
  const html = buildAlertEmail(failure, config);

  await sendApmMail(settings.adminEmail, subject, html, 'ODP Console');
}

export async function runRepoMonitorCheck() {
  try {
    const settings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
    if (!settings?.repoMonitorEnabled) return;

    const config = getConfig(settings);
    if (!config) {
      // Dépôt non configuré — on ne surveille rien tant que le chemin n'est pas renseigné.
      return;
    }

    const minFreePercent = settings.repoMinFreePercent ?? MIN_FREE_PERCENT_DEFAULT;
    const lastState = settings.repoMonitorState || '';
    const lastAlertAt = settings.repoMonitorLastAlertAt instanceof Date
      ? settings.repoMonitorLastAlertAt.getTime()
      : settings.repoMonitorLastAlertAt
        ? new Date(settings.repoMonitorLastAlertAt).getTime()
        : 0;

    let failure: { type: string; message?: string; disk?: any } | null = null;

    const access = await testRepoAccess(config);
    if (!access.success) {
      failure = { type: 'access', message: access.message };
    } else {
      const disk = await getRepoDiskSpace(config);
      if (!disk) {
        failure = { type: 'space-unavailable' };
      } else if (disk.percentFree < minFreePercent) {
        failure = { type: 'space', disk };
      }
    }

    const newState = failure ? 'failed' : 'ok';
    const now = new Date();
    const shouldAlert =
      failure &&
      (lastState !== 'failed' || (now.getTime() - lastAlertAt) >= RE_ALERT_DELAY_MS);

    const updateData: any = {
      repoMonitorState: newState,
      repoMonitorLastCheck: now,
    };

    if (shouldAlert) {
      try {
        await sendRepoAlertEmail(settings, failure!, config);
        updateData.repoMonitorLastAlertAt = now;
        console.log(`[REPO-MONITOR] Alerte envoyée à ${settings.adminEmail}`);
      } catch (err: any) {
        console.error('[REPO-MONITOR] Échec d\'envoi de l\'alerte:', err?.message || err);
      }
    }

    await (prisma as any).appSettings.update({
      where: { id: 1 },
      data: updateData,
    });
  } catch (err: any) {
    console.error('[REPO-MONITOR] Erreur inattendue:', err?.message || err);
  }
}

let started = false;

export function startRepoMonitor() {
  if (started) return;
  const g = globalThis as any;
  if (g.__odpRepoMonitorStarted) return;
  g.__odpRepoMonitorStarted = true;
  started = true;

  console.log('[REPO-MONITOR] Surveillance du dépôt programmée (toutes les 4 h).');
  setTimeout(() => {
    runRepoMonitorCheck().catch(() => {});
  }, STARTUP_DELAY_MS);
  setInterval(() => {
    runRepoMonitorCheck().catch(() => {});
  }, CHECK_INTERVAL_MS);
}