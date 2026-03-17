import axios from 'axios';
import { prisma } from './prisma';

async function getSettings() {
  const settings = await prisma.appSettings.findFirst();
  return {
    url: settings?.apmUrl || 'http://localhost:8001/api/v1',
    token: settings?.apmToken || 'DSIHUB-ODP-KEY-2026',
    senderName: settings?.senderName || 'ODP Console',
    senderEmail: settings?.senderEmail || 'dsihub@fbc.fr'
  };
}

export async function sendApmMail(to: string, subject: string, content: string, fromName?: string) {
  try {
    const { url, token, senderName, senderEmail } = await getSettings();
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
      }
    });
    return res.data;
  } catch (error: any) {
    console.error('[APM] Mail proxy failed:', error.response?.data || error.message);
    throw error;
  }
}

export async function checkApmHealth() {
  try {
    const { url } = await getSettings();
    // Base URL is http://localhost:8001/api/v1, status is at /api/status
    const baseUrl = url.replace('/v1', '');
    const res = await axios.get(`${baseUrl}/status`);
    return res.data.status.includes('running');
  } catch {
    return false;
  }
}
