import axios from 'axios';
import { prisma } from './prisma';
import https from 'https';

export const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function getApmSettings() {
  const rows = await (prisma as any).$queryRaw`SELECT * FROM AppSettings WHERE id = 1`;
  const settings: any = (rows as any[])[0] || null;

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

export async function sendApmMail(
  to: string,
  subject: string,
  content: string,
  fromName?: string,
  attachments?: MailAttachment[]
) {
  try {
    const { url, token, senderName, senderEmail, footer1, footer2, footer3, footerColor } = await getApmSettings();

    const payload: Record<string, any> = {
      to,
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
  } catch (error: any) {
    console.error('[APM] Mail proxy failed:', error.response?.data || error.message);
    throw error;
  }
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
