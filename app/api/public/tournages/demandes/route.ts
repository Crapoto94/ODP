import { NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { searchAddress } from '@/lib/geocoding';
import { envoyerMailTournage } from '@/lib/tournage-mail';
import { lireConfigTournage, reglesDe, validerDemande, verifierCleApi } from '@/lib/tournage-service';
import { dateLimiteReponse, parseIso } from '@/lib/tournage-regles';

const MAX = 10 * 1024 * 1024;
const EXT_OK = ['pdf', 'png', 'jpg', 'jpeg'];
const PIECES: { champ: string; kind: string; libelle: string }[] = [
  { champ: 'assurance', kind: 'ASSURANCE', libelle: "Attestation d'assurance" },
  { champ: 'plan', kind: 'PLAN', libelle: 'Plan de localisation du matériel et des véhicules' },
  { champ: 'ecole', kind: 'ECOLE', libelle: "Attestation de l'école" },
  { champ: 'autre', kind: 'AUTRE', libelle: 'Pièce complémentaire' },
];

// Dépôt d'une demande d'autorisation de tournage (multipart : `data` JSON + pièces). Authentifié par clé API.
export async function POST(req: Request) {
  try {
    if (!(await verifierCleApi(req))) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 });
    const row = await lireConfigTournage();
    if (!row.actif) return NextResponse.json({ error: 'Le dépôt de demandes est actuellement fermé.' }, { status: 403 });
    const regles = reglesDe(row);

    const form = await req.formData();
    let donnees: any;
    try { donnees = JSON.parse(String(form.get('data') || '{}')); } catch { return NextResponse.json({ errors: ['Données illisibles.'] }, { status: 400 }); }

    const fichiers: { kind: string; libelle: string; file: File }[] = [];
    for (const p of PIECES) {
      for (const f of form.getAll(p.champ)) {
        if (!(f instanceof File) || !f.size) continue;
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!EXT_OK.includes(ext)) return NextResponse.json({ errors: [`${p.libelle} : format non accepté (PDF, PNG ou JPG).`] }, { status: 400 });
        if (f.size > MAX) return NextResponse.json({ errors: [`${p.libelle} : fichier trop volumineux (10 Mo maximum).`] }, { status: 400 });
        fichiers.push({ kind: p.kind, libelle: p.libelle, file: f });
      }
    }
    const a = (k: string) => fichiers.some((f) => f.kind === k);
    const { erreurs, jours } = validerDemande(donnees, regles, new Date(), { assurance: a('ASSURANCE'), plan: a('PLAN'), ecole: a('ECOLE') });
    if (erreurs.length) return NextResponse.json({ errors: erreurs }, { status: 422 });

    const annee = new Date().getFullYear();
    const n = (await (prisma as any).demandeTournage.count({ where: { reference: { startsWith: `TOU-${annee}-` } } })) + 1;
    const reference = `TOU-${annee}-${String(n).padStart(4, '0')}`;

    const dossier = join(process.cwd(), 'public', 'uploads', 'tournages', reference);
    await mkdir(dossier, { recursive: true });
    const pieces: any[] = [];
    for (const f of fichiers) {
      const ext = (f.file.name.split('.').pop() || 'pdf').toLowerCase();
      const nom = `${randomUUID()}.${ext}`;
      await writeFile(join(dossier, nom), Buffer.from(await f.file.arrayBuffer()));
      pieces.push({ kind: f.kind, libelle: f.libelle, nom: f.file.name, chemin: `/uploads/tournages/${reference}/${nom}`, taille: f.file.size });
    }

    // Position de l'adresse pour la carte (échec toléré : géocodé plus tard à l'affichage de la carte)
    try {
      const g = (await searchAddress(String(donnees.lieu.adresse)))[0];
      if (g) donnees.lieu = { ...donnees.lieu, latitude: g.latitude, longitude: g.longitude };
    } catch { /* ignoré */ }

    const dem = donnees.demandeur;
    const creee = await (prisma as any).demandeTournage.create({
      data: {
        reference,
        dateLimiteReponse: dateLimiteReponse(new Date(), regles),
        premiereDate: jours[0] ? parseIso(jours[0]) : null,
        derniereDate: jours.length ? parseIso(jours[jours.length - 1]) : null,
        societe: dem.societe.trim(), demandeurNom: dem.nom.trim(), email: dem.email.trim(), telephone: dem.telephone?.trim() || null,
        titre: donnees.titre.trim(), typeFilm: donnees.typeFilm.trim(),
        donnees, pieces,
      },
    });

    // Accusé de réception au demandeur + notification interne (modèles éditables ; échecs journalisés sans bloquer le dépôt)
    envoyerMailTournage('MSG_TOURNAGE_ACCUSE', dem.email.trim(), creee, row)
      .catch((e) => console.error('[TOURNAGE] accusé de réception:', e.message));
    if (row.emailNotification) {
      envoyerMailTournage('MSG_TOURNAGE_NOTIFICATION', row.emailNotification, creee, row)
        .catch((e) => console.error('[TOURNAGE] notification:', e.message));
    }

    return NextResponse.json({ success: true, reference, id: creee.id });
  } catch (e: any) {
    console.error('[TOURNAGE DEPOT]', e);
    return NextResponse.json({ errors: ['Erreur interne, veuillez réessayer plus tard.'] }, { status: 500 });
  }
}
