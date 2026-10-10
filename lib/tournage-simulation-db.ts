import { prisma } from '@/lib/prisma';
import { CODES, simuler, normaliserOptions, type Surcharges, type Tarifs } from '@/lib/tournage-simulation';

// Prix des articles de tournage (module Tarifs & Articles) pour une année : par numéro, désignation contenant « tournage ».
// Si l'année demandée n'existe pas pour un code, on prend l'année la plus proche antérieure, à défaut la plus récente.
export async function chargerTarifs(annee: number): Promise<Tarifs> {
  const numeros = Array.from(new Set(Object.values(CODES).map((c) => c.numero)));
  const articles = await (prisma as any).article.findMany({
    where: { numero: { in: numeros }, designation: { contains: 'ournage', mode: 'insensitive' } },
    orderBy: { annee: 'desc' },
  });
  const tarifs: Tarifs = {};
  for (const [code, def] of Object.entries(CODES)) {
    const candidats = articles.filter((a: any) => a.numero === def.numero);
    const choisi = candidats.find((a: any) => a.annee <= annee) || candidats[0];
    if (choisi) tarifs[code] = { montant: choisi.montant, designation: choisi.designation, articleId: choisi.id };
  }
  return tarifs;
}

// Simulation d'une demande avec les tarifs de la base, les options du paramétrage et les surcharges enregistrées sur la demande
export async function simulerDemande(demande: any, optionsConfig: any, surchargesOverride?: Surcharges) {
  const donnees = demande.donnees || {};
  const surcharges: Surcharges = surchargesOverride ?? donnees.simulationSurcharges ?? {};
  const premier = (donnees.jours || []).map((j: any) => j.date).sort()[0];
  const annee = premier ? Number(String(premier).slice(0, 4)) : new Date().getFullYear();
  const tarifs = await chargerTarifs(annee);
  const options = normaliserOptions(optionsConfig);
  return { simulation: simuler(donnees, demande.typeFilm, tarifs, options, surcharges), surcharges, options, tarifsDepuisBase: Object.keys(tarifs).length };
}
