import axios from 'axios';
import { prisma } from './prisma';
import https from 'https';

export const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function getApmSettings() {
  const settings = await (prisma as any).appSettings.findFirst({
    where: { id: 1 }
  });

  let url = (settings?.apmUrl || 'http://localhost:8001/api/v1').trim().replace(/\/$/, '');

  // Robust check for /api and /v1 in the path (not the domain)
  const path = url.split('://')[1]?.split('/').slice(1).join('/') || '';
  const normalizedPath = '/' + path;

  if (!normalizedPath.includes('/api')) {
    url += '/api/v1';
  } else if (!normalizedPath.includes('/v1')) {
    url += '/v1';
  }

  return {
    url,
    token: settings?.apmToken || 'DSIHUB-ODP-KEY-2026',
    senderName: settings?.senderName || 'ODP Console',
    senderEmail: settings?.senderEmail || 'dsihub@fbc.fr',
    footer1: settings?.footer1 || null,
    footer2: settings?.footer2 || null,
    footer3: settings?.footer3 || null,
    footerColor: settings?.footerColor || null,
    adDomain: settings?.adDomain || null,
  };
}

export interface MailAttachment {
  filename: string;
  content: string; // base64
  content_type: string;
}

/**
 * Parse a recipient field that may contain several addresses separated by
 * ";" or "," (e.g. "nom1@fbc.fr ; nom2@ivry94.fr"). Returns a deduplicated
 * list of trimmed, non-empty addresses.
 */
export function parseRecipients(to: string | string[]): string[] {
  const raw = Array.isArray(to) ? to.join(';') : (to || '');
  const list = raw
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  return Array.from(new Set(list));
}

export async function sendApmMail(
  to: string | string[],
  subject: string,
  content: string,
  fromName?: string,
  attachments?: MailAttachment[]
) {
  const { url, token, senderName, senderEmail, footer1, footer2, footer3, footerColor } = await getApmSettings();

  const recipients = parseRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Aucun destinataire valide fourni pour l\'envoi du mail');
  }

  const sendOne = async (recipient: string) => {
    const payload: Record<string, any> = {
      to: recipient,
      subject,
      content,
      from_name: fromName || senderName,
      from_email: senderEmail,
      is_raw: false,
    };
    if (footer1) payload.footer1 = footer1;
    if (footer2) payload.footer2 = footer2;
    if (footer3) payload.footer3 = footer3;
    if (footerColor) payload.footer_color = footerColor;
    if (attachments?.length) payload.attachments = attachments;

    const res = await axios.post(`${url}/mail/send`, payload, {
      headers: { 'X-API-KEY': token },
      httpsAgent,
    });
    return res.data;
  };

  // Send one mail per recipient so delivery works regardless of the proxy's
  // multi-recipient support. Don't let one failure block the others.
  const results: any[] = [];
  const errors: { recipient: string; message: string }[] = [];
  for (const recipient of recipients) {
    try {
      results.push(await sendOne(recipient));
    } catch (error: any) {
      const message = error.response?.data || error.message;
      console.error(`[APM] Mail proxy failed for ${recipient}:`, message);
      errors.push({ recipient, message: typeof message === 'string' ? message : JSON.stringify(message) });
    }
  }

  // Throw only if every recipient failed (so partial sends still notify someone).
  if (results.length === 0) {
    throw new Error(`Échec de l'envoi du mail à tous les destinataires: ${errors.map((e) => e.recipient).join(', ')}`);
  }

  return results.length === 1 ? results[0] : results;
}

export async function checkApmHealth() {
  try {
    const { url } = await getApmSettings();
    // url is something like .../api/v1. Status is at .../api/status
    const statusUrl = url.replace(/\/v1$/, '') + '/status';
    const res = await axios.get(statusUrl, { httpsAgent });
    return res.data.status.includes('running');
  } catch {
    return false;
  }
}
