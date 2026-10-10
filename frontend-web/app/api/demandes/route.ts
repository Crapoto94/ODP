import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Transmet la demande (multipart) au back avec la clé API. Limite simple de débit par IP.
const essais = new Map<string, number[]>();

export async function POST(req: Request) {
  const back = process.env.BACK_URL;
  const cle = process.env.TOURNAGE_API_KEY;
  if (!back || !cle) return NextResponse.json({ errors: ['Service non configuré'] }, { status: 503 });

  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const maintenant = Date.now();
  const recents = (essais.get(ip) || []).filter((t) => maintenant - t < 10 * 60 * 1000);
  if (recents.length >= 5) return NextResponse.json({ errors: ['Trop de demandes depuis votre adresse, réessayez dans quelques minutes.'] }, { status: 429 });
  essais.set(ip, [...recents, maintenant]);

  try {
    const form = await req.formData();
    if (form.get('site_web')) return NextResponse.json({ success: true, reference: 'OK' }); // champ piège anti-robot
    form.delete('site_web');
    const r = await fetch(`${back}/api/public/tournages/demandes`, { method: 'POST', headers: { 'x-api-key': cle }, body: form });
    const data = await r.json().catch(() => ({ errors: ['Réponse illisible du service.'] }));
    return NextResponse.json(data, { status: r.status === 401 ? 502 : r.status });
  } catch {
    return NextResponse.json({ errors: ['Service momentanément indisponible, veuillez réessayer.'] }, { status: 502 });
  }
}
