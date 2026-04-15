import axios from 'axios';
import { getApmSettings } from './apm';

/**
 * Authentifie un utilisateur AD via le proxy APM.
 * L'APM expose POST /ad/authenticate { login, password, domain? }
 */
export async function authenticateAD(login: string, password: string): Promise<boolean> {
  if (!password || !password.trim()) return false;
  try {
    const { url, token, httpsAgent } = await getVilleSettingsWithAgent();
    // Strip @domain if the login is stored as UPN (e.g. MaChevalier@ivry94.fr → MaChevalier)
    const shortLogin = login.includes('@') ? login.split('@')[0] : login;
    const res = await axios.post(
      `${url}/ad/authenticate`,
      { username: shortLogin, password },
      { headers: { 'X-API-KEY': token }, httpsAgent, timeout: 6000 }
    );
    return res.data?.success === true || res.data?.authenticated === true;
  } catch (err: any) {
    console.warn('[AD-AUTH] échec:', err.response?.data || err.message);
    return false;
  }
}

/**
 * Recherche des comptes Azure AD via le proxy APM.
 * L'APM expose GET /azure/search?q=term
 * Retourne [] si indisponible.
 */
export async function searchAD(q: string): Promise<AdUser[]> {
  if (!q || q.length < 2) return [];
  const { url, token, httpsAgent } = await getVilleSettingsWithAgent();

  const endpoint = `${url}/azure/search`;
  try {
    const res = await axios.get(endpoint, {
      params: { q },
      headers: { 'X-API-KEY': token },
      httpsAgent,
      timeout: 6000,
    });
    if (!Array.isArray(res.data)) return [];
    return res.data
      .filter((u: any) => u && (u.userPrincipalName || u.mail))
      .map((u: any) => {
        const upn = u.userPrincipalName || u.mail || '';
        const shortLogin = upn.split('@')[0];
        return {
          sam_account: shortLogin,
          display_name: u.displayName || upn,
          mail: u.mail || upn,
        };
      });
  } catch (err: any) {
    console.warn('[AD-SEARCH] azure/search →', err.response?.status, err.response?.data || err.message);
    return [];
  }
}

export interface AdUser {
  sam_account: string;
  display_name: string;
  mail?: string;
}

// Helper : récupère les settings APM (mail + AD = même API) avec agent https
async function getVilleSettingsWithAgent() {
  const s = await getApmSettings();
  const https = await import('https');
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  return { url: s.url, token: s.token, httpsAgent };
}
