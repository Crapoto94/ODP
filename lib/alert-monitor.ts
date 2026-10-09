import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';

// Alerte « date d'alerte » des dossiers CHANTIER / TOURNAGE : le jour J, un mail est envoyé à tous les instructeurs
// (utilisateurs de rôle INSTRUCTEUR) avec la liste des dossiers concernés.
//  - Planificateur interne (comme la surveillance du dépôt Filien) : contrôle toutes les 30 min, envoi à partir de 7 h (heure de Paris).
//  - Aucune table supplémentaire : l'envoi est tracé par une note sur chaque dossier, qui sert aussi d'anti-doublon
//    (redémarrage de l'application, plusieurs contrôles dans la journée).
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const STARTUP_DELAY_MS = 60 * 1000;
const SEND_FROM_HOUR = 7;
const TZ = 'Europe/Paris';
const TYPES = ['CHANTIER', 'TOURNAGE'];

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Date et heure « Paris » du jour : { iso: 'YYYY-MM-DD', fr: 'jj/mm/aaaa', hour }
function parisNow(now = new Date()) {
  const p = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value || '';
  return { iso: `${get('year')}-${get('month')}-${get('day')}`, fr: `${get('day')}/${get('month')}/${get('year')}`, hour: parseInt(get('hour'), 10) % 24 };
}

const noteMarker = (fr: string) => `🔔 Alerte du ${fr} envoyée aux instructeurs`;

function buildMail(dossiers: any[], baseUrl: string, dateFr: string) {
  const rows = dossiers.map((d) => {
    const lien = `${baseUrl}/dashboard/occupations/${d.id}`;
    const type = d.type === 'TOURNAGE' ? 'Tournage' : 'Chantier';
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px"><a href="${lien}" style="color:#2563eb;font-weight:bold;text-decoration:none">#${d.id} ${esc(d.nom || 'Sans libellé')}</a><br/><span style="color:#6b7280">${type}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${esc(d.tiers?.nom)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${esc(d.adresse)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${esc(d.statut)}</td>
    </tr>`;
  }).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:720px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#d97706;color:#fff;padding:16px 24px;font-size:16px;font-weight:bold">🔔 Alerte dossiers — ${dateFr}</div>
  <div style="padding:24px;color:#1f2937">
    <p style="font-size:14px;margin:0 0 16px">La date d'alerte est atteinte aujourd'hui pour ${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} :</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="background:#f9fafb;text-align:left">
        <th style="padding:8px 10px;font-size:12px;color:#6b7280">Dossier</th>
        <th style="padding:8px 10px;font-size:12px;color:#6b7280">Demandeur</th>
        <th style="padding:8px 10px;font-size:12px;color:#6b7280">Adresse</th>
        <th style="padding:8px 10px;font-size:12px;color:#6b7280">Statut</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#6b7280;margin:0">Vous recevez ce mail en tant qu'instructeur ODP (alerte définie sur le dossier).</p>
  </div>
</div></body></html>`;
}

export async function runAlertCheck(now = new Date()) {
  const today = parisNow(now);
  if (today.hour < SEND_FROM_HOUR) return { sent: 0, reason: 'avant 7 h' };

  const settings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
  const baseUrl = String(settings?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Dossiers dont la date d'alerte est AUJOURD'HUI (date saisie = minuit UTC ; on compare la partie date)
  const from = new Date(`${today.iso}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const candidats = await (prisma as any).occupation.findMany({
    where: {
      type: { in: TYPES },
      isArchived: false,
      statut: { notIn: ['CLOS', 'PAYE', 'PAYÉ'] },
      dateAlerte: { gte: from, lt: to },
    },
    select: { id: true, nom: true, type: true, adresse: true, statut: true, tiers: { select: { nom: true } } },
  });
  if (!candidats.length) return { sent: 0, reason: 'aucune alerte' };

  // Anti-doublon : on écarte les dossiers déjà notifiés aujourd'hui
  const marker = noteMarker(today.fr);
  const dejaNotifies = await (prisma as any).note.findMany({
    where: { occupationId: { in: candidats.map((d: any) => d.id) }, content: marker },
    select: { occupationId: true },
  });
  const deja = new Set(dejaNotifies.map((n: any) => n.occupationId));
  const aNotifier = candidats.filter((d: any) => !deja.has(d.id));
  if (!aNotifier.length) return { sent: 0, reason: 'déjà envoyé' };

  const instructeurs = await (prisma as any).user.findMany({ where: { role: 'INSTRUCTEUR' }, select: { email: true } });
  const destinataires = instructeurs.map((u: any) => u.email).filter(Boolean);
  if (!destinataires.length) {
    console.warn('[ALERTES] Aucun instructeur avec adresse e-mail : alerte non envoyée');
    return { sent: 0, reason: 'aucun destinataire' };
  }

  const sujet = `[ODP] Alerte dossiers du ${today.fr} — ${aNotifier.length} dossier${aNotifier.length > 1 ? 's' : ''} chantier / tournage`;
  await sendApmMail(destinataires, sujet, buildMail(aNotifier, baseUrl, today.fr), 'ODP Console');

  // Trace + anti-doublon (seulement après un envoi réussi : en cas d'échec, nouvel essai au prochain contrôle)
  const stamp = new Date().toISOString();
  for (const d of aNotifier) {
    await (prisma as any).note.create({
      data: { occupationId: d.id, content: marker, author: 'Système (alertes)', isEmail: true, origin: 'desktop', created_at: stamp },
    });
  }
  console.log(`[ALERTES] ${aNotifier.length} dossier(s) notifié(s) à ${destinataires.length} instructeur(s)`);
  return { sent: aNotifier.length, destinataires: destinataires.length };
}

let started = false;
export function startAlertMonitor() {
  const g = globalThis as any;
  if (started || g.__odpAlertMonitorStarted) return;
  // Un poste de développement partage souvent la base de production : pas d'envoi de mails réels hors production
  // (sauf ODP_ALERTS_FORCE=1 pour un essai volontaire).
  if (process.env.NODE_ENV !== 'production' && process.env.ODP_ALERTS_FORCE !== '1') {
    console.log("[ALERTES] Envoi des alertes désactivé hors production (ODP_ALERTS_FORCE=1 pour forcer).");
    return;
  }
  g.__odpAlertMonitorStarted = true;
  started = true;
  console.log('[ALERTES] Envoi quotidien des alertes aux instructeurs programmé (contrôle toutes les 30 min, dès 7 h).');
  const run = () => runAlertCheck().catch((e) => console.error('[ALERTES] Erreur :', e?.message || e));
  setTimeout(run, STARTUP_DELAY_MS);
  setInterval(run, CHECK_INTERVAL_MS);
}

// Envoi d'essai : mail identique à l'alerte réelle (3 dossiers chantier/tournage ayant une date d'alerte), adressé à UNE seule
// adresse. N'écrit aucune note et ne notifie personne d'autre.
export async function envoyerAlerteEssai(destinataire: string) {
  const settings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
  const baseUrl = String(settings?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const dossiers = await (prisma as any).occupation.findMany({
    where: { type: { in: TYPES }, isArchived: false, dateAlerte: { not: null } },
    orderBy: { dateAlerte: 'desc' },
    take: 3,
    select: { id: true, nom: true, type: true, adresse: true, statut: true, tiers: { select: { nom: true } } },
  });
  if (!dossiers.length) throw new Error("Aucun dossier chantier/tournage avec date d'alerte pour l'essai");
  const today = parisNow();
  await sendApmMail(destinataire, `[ODP] ESSAI — Alerte dossiers du ${today.fr}`, buildMail(dossiers, baseUrl, today.fr), 'ODP Console');
  return { destinataire, dossiers: dossiers.length };
}
