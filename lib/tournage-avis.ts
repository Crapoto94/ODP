import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { envoyerMailTournage } from '@/lib/tournage-mail';

// Demandes d'avis aux services (DAC = point d'entrée) : lien à jeton envoyé par mail, réponse sans authentification.

export { STATUTS_AVIS } from '@/lib/tournage-regles';

const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const parseEmails = (v: any): string[] =>
  Array.from(new Set((Array.isArray(v) ? v.join(';') : String(v || '')).split(/[;,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => RE_MAIL.test(e))));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

export async function lienAvis(token: string) {
  const settings = await (prisma as any).appSettings.findFirst().catch(() => null);
  const base = String(settings?.appUrl || '').replace(/\/$/, '');
  return `${base}/avis/${token}`;
}

async function envoyerAvis(cle: 'MSG_TOURNAGE_AVIS_DEMANDE' | 'MSG_TOURNAGE_AVIS_RELANCE', avis: any, demande: any, cfg: any) {
  const lien = await lienAvis(avis.token);
  await envoyerMailTournage(cle, parseEmails(avis.destinataires).join(';'), demande, cfg, {
    SERVICE: avis.serviceNom, LIEN_AVIS: lien, MESSAGE: esc(avis.message || '—'),
  });
}

export interface DemandeAvisInput {
  serviceIds?: number[];
  libres?: { nom?: string; emails: string }[];
  message?: string;
}

// Crée les demandes d'avis et envoie les mails. Retourne le détail (y compris les échecs) pour l'affichage.
export async function creerAvis(demande: any, cfg: any, input: DemandeAvisInput, par: string) {
  const db = prisma as any;
  const resultats: { service: string; ok: boolean; erreur?: string; avisId?: number }[] = [];

  const cibles: { serviceId: number | null; nom: string; libre: boolean; emails: string[]; questions: any[] }[] = [];
  if (input.serviceIds?.length) {
    const services = await db.serviceInstructeur.findMany({ where: { id: { in: input.serviceIds }, actif: true } });
    for (const s of services) cibles.push({ serviceId: s.id, nom: s.nom, libre: false, emails: parseEmails(s.emails), questions: Array.isArray(s.questions) ? s.questions : [] });
  }
  for (const l of input.libres || []) {
    const emails = parseEmails(l.emails);
    cibles.push({ serviceId: null, nom: (l.nom || '').trim() || 'Avis libre', libre: true, emails, questions: [] });
  }

  for (const c of cibles) {
    if (!c.emails.length) { resultats.push({ service: c.nom, ok: false, erreur: "Aucune adresse e-mail (à renseigner dans Paramètres › Gestion des tournages › Services consultés)" }); continue; }
    const avis = await db.avisTournage.create({
      data: {
        demandeId: demande.id, serviceId: c.serviceId, serviceNom: c.nom, libre: c.libre, destinataires: c.emails,
        token: randomBytes(24).toString('hex'), message: input.message?.trim() || null, questions: c.questions, demandePar: par,
      },
    });
    try {
      await envoyerAvis('MSG_TOURNAGE_AVIS_DEMANDE', avis, demande, cfg);
      resultats.push({ service: c.nom, ok: true, avisId: avis.id });
    } catch (e: any) {
      // La demande est enregistrée ; le mail pourra être renvoyé par une relance
      resultats.push({ service: c.nom, ok: false, avisId: avis.id, erreur: `Enregistré mais mail non envoyé : ${e.message}` });
    }
  }
  return resultats;
}

export async function relancerAvis(avis: any, demande: any, cfg: any) {
  await envoyerAvis('MSG_TOURNAGE_AVIS_RELANCE', avis, demande, cfg);
  await (prisma as any).avisTournage.update({ where: { id: avis.id }, data: { derniereRelance: new Date(), nbRelances: { increment: 1 } } });
}

// Libellé lisible des réponses aux questions du service
export function resumeReponses(questions: any[], reponses: any): string {
  if (!Array.isArray(questions) || !questions.length || !reponses) return '—';
  return questions.map((q) => `${q.libelle} : ${reponses[q.id] === true ? 'Oui' : reponses[q.id] === false ? 'Non' : (reponses[q.id] || '—')}`).join('<br>');
}
