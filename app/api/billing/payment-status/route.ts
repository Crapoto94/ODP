import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lireEtatPaiement } from '@/lib/sedit-paiement';
import { synchroniserStatuts } from '@/lib/sedit-statut';
import { getSession } from '@/lib/auth';

// Cache mémoire (5 min) : l'interrogation d'Oracle SEDIT est lente ; `refresh: true` force une relecture.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: any }>();

// POST { runId?: string, refresh?: boolean } → état de paiement SEDIT des titres associés aux factures (tous les trains, ou un seul).
// Met aussi à jour le statut des dossiers : titre payé → CLOS, titre émis non payé → TITRE (lib/sedit-statut.ts).
export async function POST(req: NextRequest) {
  try {
    const { runId, refresh } = await req.json().catch(() => ({}));
    const cleCache = runId || '*';
    const enCache = cache.get(cleCache);
    if (!refresh && enCache && Date.now() - enCache.at < TTL_MS) return NextResponse.json(enCache.data);
    const runs = await (prisma as any).billingRun.findMany({ where: runId ? { id: runId } : {}, include: { invoices: true } });
    const aVerifier: { numero: string; codeSedit: string | null; total: number; dateRef: Date }[] = [];
    for (const run of runs) {
      const occs = await (prisma as any).occupation.findMany({
        where: { id: { in: run.invoices.map((i: any) => i.dossierId) } },
        select: { id: true, tiers: { select: { code_sedit: true } } },
      });
      const code = new Map<number, string | null>(occs.map((o: any) => [o.id, o.tiers?.code_sedit || null]));
      for (const inv of run.invoices) aVerifier.push({ numero: inv.numero, codeSedit: code.get(inv.dossierId) ?? null, total: inv.total, dateRef: new Date(run.date) });
    }
    const resultats = await lireEtatPaiement(aVerifier);
    const session = await getSession();
    const auteur = session ? `${session.prenom} ${session.nom}`.trim() : 'Système (SEDIT)';
    const changements = await synchroniserStatuts(resultats, auteur).catch((e) => { console.error('[STATUT SEDIT]', e); return []; });
    const maj = new Map(changements.map((c) => [c.numero, c.vers]));
    const data = Object.fromEntries(resultats.map((r) => [r.numero, { ...r, statutMisAJour: maj.get(r.numero) || null }]));
    cache.set(cleCache, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PAYMENT STATUS]', error);
    return NextResponse.json({ error: error.response?.data?.error || error.message }, { status: 500 });
  }
}
