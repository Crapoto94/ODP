import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

// Envoi des e-mails du module tournages : modèles éditables (Paramètres › Gestion des tournages › Modèles d'e-mails),
// expéditeur et pieds de page propres aux tournages (repli sur les réglages généraux).

const fr = (iso: string) => (iso || '').split('-').reverse().join('/');
const frDate = (d: any) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export function varsDemande(demande: any, cfg: any, extra: Record<string, string> = {}): Record<string, string> {
  const d = demande.donnees || {};
  const jours: string[] = (d.jours || []).map((j: any) => fr(j.date));
  const lieu = [d.lieu?.adresse, (d.lieu?.emplacements || []).join(', ')].filter(Boolean).join(' — ');
  const nb = Number(cfg?.delaiInstruction ?? 15);
  return {
    REFERENCE: demande.reference,
    DEMANDEUR: demande.demandeurNom,
    SOCIETE: demande.societe,
    TITRE: demande.titre,
    TYPE_FILM: demande.typeFilm,
    DATES: jours.join(', ') || '—',
    LIEU: lieu || '—',
    EMAIL: demande.email,
    TELEPHONE: demande.telephone || '—',
    DELAI: `${nb} ${cfg?.typeJours === 'CALENDAIRES' ? 'jours calendaires' : 'jours ouvrés'}`,
    DATE_LIMITE: frDate(demande.dateLimiteReponse),
    MESSAGE: '',
    LIEN_DEMANDE: '',
    ...extra,
  };
}

export async function envoyerMailTournage(cle: string, to: string, demande: any, cfg: any, extra: Record<string, string> = {}) {
  const settings = await (prisma as any).appSettings.findFirst().catch(() => null);
  const base = String(settings?.appUrl || '').replace(/\/$/, '');
  const vars = varsDemande(demande, cfg, { LIEN_DEMANDE: `${base}/dashboard/tournages/demandes`, ...extra });
  const { html, subject } = await getContextualMessageData(cle, vars);
  if (!html) return { skipped: true }; // modèle désactivé
  // Le message libre est saisi en texte : retours à la ligne conservés
  const contenu = html.replace(/<p>\s*<\/p>/g, '');
  await sendApmMail(to, subject || `Demande de tournage ${demande.reference}`, contenu, cfg?.mailExpediteurNom || undefined, undefined, {
    fromEmail: cfg?.mailExpediteurEmail, footer1: cfg?.mailFooter1, footer2: cfg?.mailFooter2, footer3: cfg?.mailFooter3, footerColor: cfg?.mailFooterColor,
  });
  return { skipped: false };
}

// Mail de test (aperçu de l'expéditeur et du pied de page) avec une demande fictive
export async function envoyerMailTest(to: string, cfg: any) {
  const demande = {
    reference: 'TOU-TEST-0000', demandeurNom: 'Prénom Nom', societe: 'Société de production', titre: 'Projet de test', typeFilm: 'Fiction',
    email: to, telephone: '01 00 00 00 00', dateLimiteReponse: new Date(),
    donnees: { jours: [{ date: new Date().toISOString().slice(0, 10) }], lieu: { adresse: 'Rue exemple, Ivry-sur-Seine', emplacements: ['Trottoir'] } },
  };
  return envoyerMailTournage('MSG_TOURNAGE_ACCUSE', to, demande, cfg);
}
