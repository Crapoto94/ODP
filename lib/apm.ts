import axios from 'axios';
import { prisma } from './prisma';
import https from 'https';

export const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function getApmSettings() {
  const settings = await prisma.appSettings.findFirst();
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
    senderEmail: settings?.senderEmail || 'dsihub@fbc.fr'
  };
}

export async function sendApmMail(to: string, subject: string, content: string, fromName?: string) {
  try {
    const { url, token, senderName, senderEmail } = await getApmSettings();
    const res = await axios.post(`${url}/mail/send`, {
      to,
      subject,
      content,
      from_name: fromName || senderName,
      from_email: senderEmail,
      is_raw: true
    }, {
      headers: {
        'X-API-KEY': token
      },
      httpsAgent
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
