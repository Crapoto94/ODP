import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { resumeReponses } from '@/lib/tournage-avis';

async function autorise() {
  const s = await getSession();
  return s && hasPermissionServer(s.role, 'VIEW_TOURNAGES') ? s : null;
}

const fr = (iso: string) => (iso || '').split('-').reverse().join('/');

// Dossier ODP lié à la demande + tiers candidats (même nom ou même e-mail) pour le rattachement
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await autorise())) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    const db = prisma as any;
    const d = await db.demandeTournage.findUnique({ where: { id: Number(id) } });
    if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    const dossier = d.occupationId ? await db.occupation.findUnique({ where: { id: d.occupationId }, select: { id: true, nom: true, statut: true, dateDebut: true, dateFin: true, tiers: { select: { nom: true } } } }) : null;
    const candidats = dossier ? [] : await db.tiers.findMany({
      where: { OR: [{ nom: { equals: d.societe, mode: 'insensitive' } }, { nom: { contains: String(d.societe).split(/[\s(]/)[0], mode: 'insensitive' } }, { email: { equals: d.email, mode: 'insensitive' } }] },
      select: { id: true, nom: true, email: true, adresse: true, code_sedit: true, statut: true }, take: 8, orderBy: { nom: 'asc' },
    });
    return NextResponse.json({ dossier, candidats });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// Crée le dossier de tournage ODP à partir de la demande : { tiersId } (tiers existant) ou { creerTiers: true }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await autorise();
  if (!s) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  const { id } = await params;
  try {
    const db = prisma as any;
    const d = await db.demandeTournage.findUnique({ where: { id: Number(id) } });
    if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    if (d.occupationId) return NextResponse.json({ error: 'Un dossier est déjà lié à cette demande' }, { status: 409 });
    const body = await req.json();
    const dn = d.donnees || {};
    const auteur = `${s.prenom} ${s.nom}`.trim();

    // 1. Tiers (redevable) : existant ou nouveau (provisoire, à compléter / valider ensuite dans Gestion des tiers)
    let tiersId: number;
    let tiersCree = false;
    if (body.tiersId) {
      const t = await db.tiers.findUnique({ where: { id: Number(body.tiersId) } });
      if (!t) return NextResponse.json({ error: 'Tiers introuvable' }, { status: 404 });
      tiersId = t.id;
    } else if (body.creerTiers) {
      const t = await db.tiers.create({ data: { nom: d.societe, email: d.email, adresse: null, observations: `Créé depuis la demande de tournage ${d.reference}` } });
      tiersId = t.id; tiersCree = true;
    } else {
      return NextResponse.json({ error: 'Choisissez un tiers existant ou la création d\'un nouveau tiers' }, { status: 400 });
    }

    // 2. Dossier de tournage
    const jours: string[] = (dn.jours || []).map((j: any) => j.date).sort();
    const debut = jours[0] ? new Date(`${jours[0]}T00:00:00`) : d.premiereDate;
    const fin = jours[jours.length - 1] ? new Date(`${jours[jours.length - 1]}T00:00:00`) : d.derniereDate;
    const p = dn.personnes || {};
    const resume = [
      `Demande ${d.reference} déposée le ${new Date(d.dateDepot).toLocaleDateString('fr-FR')} — ${d.societe} (${d.demandeurNom}, ${d.email}${d.telephone ? ', ' + d.telephone : ''})`,
      `Type : ${d.typeFilm}`,
      `Jours : ${(dn.jours || []).map((j: any) => `${fr(j.date)} ${j.equipeArrivee}-${j.equipeDepart}${j.vehiculesArrivee ? ` (véhicules ${j.vehiculesArrivee}-${j.vehiculesDepart})` : ''}`).join(' ; ')}`,
      `Lieu : ${dn.lieu?.adresse || ''} — ${(dn.lieu?.emplacements || []).join(', ')}${dn.lieu?.precisions ? ` (${dn.lieu.precisions})` : ''}`,
      `Personnes : ${p.equipe || 0} équipe, ${p.comediens || 0} comédiens, ${p.figurants || 0} figurants${p.autres ? `, ${p.autres} autres${p.autresPrecision ? ` (${p.autresPrecision})` : ''}` : ''}`,
      dn.vehicules?.description ? `Véhicules / matériel : ${dn.vehicules.description}` : '',
      dn.vehicules?.nbPlaces != null ? `Places de stationnement : ${dn.vehicules.nbPlaces}${dn.vehicules.localisation ? ` (${dn.vehicules.localisation})` : ''}` : '',
      (dn.plan || []).length ? `Plan de tournage : ${(dn.plan || []).map((x: any) => `${fr(x.date)} ${x.lieu}, ${x.heures}, ${x.materiel}`).join(' ; ')}` : '',
      dn.violence || dn.armesFactices ? `Attention : ${dn.violence ? 'scènes de violence ' : ''}${dn.armesFactices ? 'armes factices' : ''}` : '',
      dn.etudiant ? `Projet étudiant (${dn.ecole?.nom || ''} — ${dn.ecole?.contact || ''}, ${dn.ecole?.telephone || ''}, ${dn.ecole?.email || ''})` : '',
      dn.cas?.drone ? 'Drone : déclaration Cerfa 15476*02 à vérifier' : '', dn.cas?.passerelle ? 'Passerelle aux câbles : demande à la Ville de Paris' : '', dn.cas?.cormailles ? 'Parc des Cormailles : demande au Conseil départemental' : '',
    ].filter(Boolean).join('\n');

    const occ = await db.occupation.create({
      data: {
        nom: d.titre, tiersId, type: 'TOURNAGE', statut: 'EN_ATTENTE', dateDebut: debut, dateFin: fin,
        anneeTaxation: debut ? new Date(debut).getFullYear() : null,
        adresse: dn.lieu?.adresse || 'Adresse à préciser',
        latitude: typeof dn.lieu?.latitude === 'number' ? dn.lieu.latitude : null, longitude: typeof dn.lieu?.longitude === 'number' ? dn.lieu.longitude : null,
        description: [dn.synopsis, dn.scenes].filter(Boolean).join('\n\n'), observations: resume, montantCalcule: 0,
        isCourtMetrage: d.typeFilm === 'Court-métrage',
      },
    });

    // 3. Contact du demandeur (sur le dossier et le tiers) + note de traçabilité
    await db.contact.create({ data: { nom: d.demandeurNom, email: d.email, telephone: d.telephone, role: 'CONTACT_DIRECT', tiersId, occupationId: occ.id, entreprise: d.societe } });
    const avis = await db.avisTournage.findMany({ where: { demandeId: d.id, statut: { not: 'ANNULE' } }, orderBy: { dateDemande: 'asc' } });
    const lignesAvis = avis.map((a: any) => `- ${a.serviceNom} : ${a.statut === 'FAVORABLE' ? 'favorable' : a.statut === 'DEFAVORABLE' ? 'défavorable' : 'pas de retour'}${a.reponseCommentaire ? ` — ${a.reponseCommentaire}` : ''}${a.reponseDonnees && a.statut !== 'EN_ATTENTE' ? ` [${resumeReponses(a.questions, a.reponseDonnees).replace(/<br>/g, ' ; ')}]` : ''}`).join('\n');
    await db.note.create({ data: { occupationId: occ.id, author: auteur, origin: 'desktop', content: `📥 Dossier créé depuis la demande de tournage ${d.reference}.${tiersCree ? ' Tiers créé (provisoire) : à compléter et valider.' : ''}${lignesAvis ? `\nAvis des services :\n${lignesAvis}` : ''}${d.notesInternes ? `\nNotes de la demande : ${d.notesInternes}` : ''}` } });

    await db.demandeTournage.update({ where: { id: d.id }, data: { occupationId: occ.id, traiteePar: auteur } });
    return NextResponse.json({ occupationId: occ.id, tiersId, tiersCree });
  } catch (e: any) {
    console.error('[TOURNAGE DOSSIER]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
