import { NextResponse } from 'next/server';

// Proxy vers le back : la clé API reste côté serveur (jamais exposée au navigateur).
// Back en HTTPS avec certificat interne / auto-signé : BACK_TLS_INSECURE=true (ou, mieux, NODE_EXTRA_CA_CERTS=/chemin/ca.pem)
if (process.env.BACK_TLS_INSECURE === 'true') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const dynamic = 'force-dynamic';

export async function GET() {
  const back = process.env.BACK_URL;
  const cle = process.env.TOURNAGE_API_KEY;
  if (!back || !cle) return NextResponse.json({ error: 'Service non configuré' }, { status: 503 });
  try {
    const r = await fetch(`${back}/api/public/tournages/config`, { headers: { 'x-api-key': cle }, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: 'Service momentanément indisponible' }, { status: 502 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Service momentanément indisponible' }, { status: 502 });
  }
}
