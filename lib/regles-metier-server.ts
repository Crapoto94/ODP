import { prisma } from '@/lib/prisma';
import { resoudre, setReglesActives, type ValeursRegles } from '@/lib/regles-metier';

// Chargement des règles métier côté serveur : lues en base (surcharges), mises en cache quelques secondes,
// puis posées dans l'état actif consulté par le code de calcul (lib/regles-metier.ts › R).
// À appeler au début de chaque calcul de facturation : `await chargerRegles()`.

const TTL_MS = 10_000;
let cache: { at: number; valeurs: ValeursRegles } | null = null;
const tablesPretes = new Set<string>();

async function assurerTable() {
  const db = prisma as any;
  const [{ s }] = await db.$queryRawUnsafe('SELECT current_schema() AS s');
  if (tablesPretes.has(s)) return;
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "RegleMetier" ("cle" TEXT NOT NULL, "valeur" JSONB NOT NULL, "modifiePar" TEXT, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "RegleMetier_pkey" PRIMARY KEY ("cle"))`);
  tablesPretes.add(s);
}

export async function lireSurcharges(): Promise<Record<string, any>> {
  await assurerTable();
  const rows = await (prisma as any).regleMetier.findMany();
  return Object.fromEntries(rows.map((r: any) => [r.cle, r.valeur]));
}

export async function chargerRegles(force = false): Promise<ValeursRegles> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) { setReglesActives(cache.valeurs); return cache.valeurs; }
  try {
    const valeurs = resoudre(await lireSurcharges());
    cache = { at: Date.now(), valeurs };
    setReglesActives(valeurs);
    return valeurs;
  } catch (e: any) {
    console.error('[REGLES] lecture impossible, valeurs par défaut :', e.message);
    return resoudre({});
  }
}

export const invaliderCacheRegles = () => { cache = null; };
