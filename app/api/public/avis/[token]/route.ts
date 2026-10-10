import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lireConfigTournage } from '@/lib/tournage-service';
import { envoyerMailTournage } from '@/lib/tournage-mail';
import { resumeReponses } from '@/lib/tournage-avis';

// Réponse d'un service à une demande d'avis : SANS authentification, protégée par le jeton du lien (valeur aléatoire de 192 bits).
const essais = new Map<string, number[]>();
function limite(ip: string) {
  const now = Date.now();
  const l = (essais.get(ip) || []).filter((t) => now - t < 60_000);
  if (l.length >= 30) return true;
  essais.set(ip, [...l, now]);
  return false;
}
const ipDe = (req: Request) => (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

async function charger(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  return (prisma as any).avisTournage.findUnique({ where: { token } });
}

const INVALIDE = "Ce lien est invalide ou n'est plus valable.";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (limite(ipDe(req))) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  const { token } = await params;
  const avis = await charger(token);
  if (!avis || avis.statut === 'ANNULE') return NextResponse.json({ error: INVALIDE }, { status: 404 });
  const d = await (prisma as any).demandeTournage.findUnique({ where: { id: avis.demandeId } });
  if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  const dn = d.donnees || {};
  // Synthèse utile à l'avis : ni coordonnées du demandeur ni pièces jointes
  return NextResponse.json({
    service: avis.serviceNom, message: avis.message, questions: avis.questions, libre: avis.libre,
    statut: avis.statut, dateReponse: avis.dateReponse, reponseCommentaire: avis.reponseCommentaire, reponseDonnees: avis.reponseDonnees, reponduPar: avis.reponduPar,
    demande: {
      reference: d.reference, titre: d.titre, typeFilm: d.typeFilm, societe: d.societe,
      jours: (dn.jours || []).map((j: any) => ({ date: j.date, equipeArrivee: j.equipeArrivee, equipeDepart: j.equipeDepart })),
      lieu: dn.lieu?.adresse, emplacements: dn.lieu?.emplacements || [], precisions: dn.lieu?.precisions || '',
      synopsis: dn.synopsis, scenes: dn.scenes, violence: !!dn.violence, armesFactices: !!dn.armesFactices,
      personnes: dn.personnes || null, vehicules: dn.vehicules?.description || '', places: dn.vehicules?.nbPlaces ?? null,
    },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (limite(ipDe(req))) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  const { token } = await params;
  try {
    const avis = await charger(token);
    if (!avis || avis.statut === 'ANNULE') return NextResponse.json({ error: INVALIDE }, { status: 404 });
    const b = await req.json();
    if (!['FAVORABLE', 'DEFAVORABLE'].includes(b.avis)) return NextResponse.json({ error: 'Indiquez un avis favorable ou défavorable.' }, { status: 400 });
    const commentaire = String(b.commentaire || '').trim().slice(0, 4000);
    if (b.avis === 'DEFAVORABLE' && commentaire.length < 3) return NextResponse.json({ error: 'Un avis défavorable doit être motivé.' }, { status: 400 });
    const questions: any[] = Array.isArray(avis.questions) ? avis.questions : [];
    const reponses: Record<string, any> = {};
    for (const q of questions) {
      const v = b.reponses?.[q.id];
      if (q.type === 'OUINON') { if (typeof v === 'boolean') reponses[q.id] = v; }
      else if (typeof v === 'string' && v.trim()) reponses[q.id] = v.trim().slice(0, 1000);
    }
    const reponduPar = String(b.nom || '').trim().slice(0, 200) || null;
    const maj = await (prisma as any).avisTournage.update({
      where: { id: avis.id },
      data: { statut: b.avis, reponseCommentaire: commentaire || null, reponseDonnees: reponses, reponduPar, dateReponse: new Date() },
    });

    // Notification interne (échec toléré)
    try {
      const cfg = await lireConfigTournage();
      if (cfg.emailNotification) {
        const d = await (prisma as any).demandeTournage.findUnique({ where: { id: avis.demandeId } });
        await envoyerMailTournage('MSG_TOURNAGE_AVIS_REPONSE', cfg.emailNotification, d, cfg, {
          SERVICE: avis.serviceNom, AVIS: b.avis === 'FAVORABLE' ? 'Favorable' : 'Défavorable', COMMENTAIRE: esc(commentaire || '—'),
          REPONSES: esc(resumeReponses(questions, reponses).replace(/<br>/g, '\n')), REPONDU_PAR: esc(reponduPar || '—'),
        });
      }
    } catch (e: any) { console.error('[TOURNAGE AVIS] notification:', e.message); }
    return NextResponse.json({ success: true, statut: maj.statut });
  } catch (e: any) {
    console.error('[TOURNAGE AVIS REPONSE]', e);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
