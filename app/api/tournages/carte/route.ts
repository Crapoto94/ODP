import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { searchAddress } from '@/lib/geocoding';
import { assurerTablesTournage } from '@/lib/tournage-service';

// Données de la carte « tournages » : dossiers de tournage (période, adresse) + demandes géolocalisées.
// Les demandes n'ont qu'une adresse saisie : elle est géocodée à la volée puis mémorisée dans la demande.
export async function GET() {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'VIEW_TOURNAGES')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  try {
    await assurerTablesTournage();
    const occs = await (prisma as any).occupation.findMany({
      where: { type: 'TOURNAGE', isArchived: false },
      select: { id: true, nom: true, statut: true, dateDebut: true, dateFin: true, adresse: true, latitude: true, longitude: true, description: true, tiers: { select: { nom: true, latitude: true, longitude: true, adresse: true } } },
    });
    const tournages = occs.map((o: any) => ({
      id: o.id, nom: o.tiers?.nom || o.nom || 'Tournage', titre: o.nom, statut: o.statut, dateDebut: o.dateDebut, dateFin: o.dateFin,
      adresse: o.adresse || o.tiers?.adresse || '', description: o.description,
      latitude: o.latitude ?? o.tiers?.latitude ?? null, longitude: o.longitude ?? o.tiers?.longitude ?? null,
    }));

    const dems = await (prisma as any).demandeTournage.findMany({ where: { statut: { notIn: ['ANNULEE'] } }, orderBy: { dateDepot: 'desc' } });
    let restant = 40; // plafond de géocodages par appel
    const demandes: any[] = [];
    for (const d of dems) {
      const donnees = d.donnees || {};
      const lieu = donnees.lieu || {};
      if (lieu.latitude == null && lieu.geocode !== 'echec' && lieu.adresse && restant > 0) {
        restant--;
        const r = (await searchAddress(String(lieu.adresse))).at(0);
        const nouveau = r ? { ...lieu, latitude: r.latitude, longitude: r.longitude } : { ...lieu, geocode: 'echec' };
        await (prisma as any).demandeTournage.update({ where: { id: d.id }, data: { donnees: { ...donnees, lieu: nouveau } } }).catch(() => {});
        lieu.latitude = nouveau.latitude; lieu.longitude = nouveau.longitude;
      }
      demandes.push({
        id: d.id, reference: d.reference, statut: d.statut, titre: d.titre, typeFilm: d.typeFilm, societe: d.societe, demandeurNom: d.demandeurNom,
        premiereDate: d.premiereDate, derniereDate: d.derniereDate, dateDepot: d.dateDepot, dateLimiteReponse: d.dateLimiteReponse,
        adresse: lieu.adresse || '', emplacements: lieu.emplacements || [],
        personnes: donnees.personnes ? ['equipe', 'comediens', 'figurants', 'autres'].reduce((s, k) => s + (Number(donnees.personnes[k]) || 0), 0) : null,
        places: donnees.vehicules?.nbPlaces ?? null,
        latitude: lieu.latitude ?? null, longitude: lieu.longitude ?? null,
      });
    }
    return NextResponse.json({ tournages, demandes });
  } catch (e: any) {
    console.error('[TOURNAGES CARTE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
