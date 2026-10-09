import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lireEtatPaiement } from '@/lib/sedit-paiement';

// POST { runId?: string } → état de paiement SEDIT des titres associés aux factures (tous les trains, ou un seul).
export async function POST(req: NextRequest) {
  try {
    const { runId } = await req.json().catch(() => ({}));
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
    return NextResponse.json(Object.fromEntries(resultats.map((r) => [r.numero, r])));
  } catch (error: any) {
    console.error('[PAYMENT STATUS]', error);
    return NextResponse.json({ error: error.response?.data?.error || error.message }, { status: 500 });
  }
}
