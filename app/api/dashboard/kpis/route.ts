import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const BILLED_STATUTS = ['FACTURE', 'FACTURÉ', 'TITRE', 'TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'];
const IN_PROGRESS_STATUTS = ['PREP', 'PREPARATION_AOT', 'EN_COURS', 'VALIDE'];
const FACTURE_STATUTS = ['FACTURE', 'FACTURÉ'];

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function monthOf(date: any): number | null {
  if (!date) return null;
  return new Date(date).getMonth();
}

async function kpisForType(where: any, currentYear: number) {
  const db = prisma as any;
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd   = new Date(currentYear + 1, 0, 1);

  const occs = await db.occupation.findMany({
    where,
    select: {
      statut: true,
      montantCalcule: true,
      facturePath: true,
      numeroFacture: true,
      aotFinalPath: true,
      aotSigned: true,
      aotDate: true,
      created_at: true,
      dateEN_COURS: true,
      dateFACTURE: true,
    },
  });

  // ── KPI aggregates ──────────────────────────────────────────────────
  const aotEmises        = occs.filter((o: any) => o.aotFinalPath || o.aotSigned).length;
  const dossiersFactures = occs.filter((o: any) => FACTURE_STATUTS.includes(o.statut)).length;
  const montantFacture   = occs
    .filter((o: any) => BILLED_STATUTS.includes(o.statut))
    .reduce((s: number, o: any) => s + (o.montantCalcule ?? 0), 0);
  const facturesEmises   = occs.filter((o: any) => o.facturePath || o.numeroFacture).length;
  const dossiersEnCours  = occs.filter((o: any) => IN_PROGRESS_STATUTS.includes(o.statut)).length;
  const total            = occs.length;

  // ── Monthly data ────────────────────────────────────────────────────
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: MONTH_LABELS[m],
    dossiers: 0,
    montant: 0,
    demandes: 0,
    aot: 0,
  }));

  for (const o of occs) {
    // Dossiers créés (restricted to current year for cross-year types)
    const mCreated = monthOf(o.created_at);
    const createdInYear = o.created_at && new Date(o.created_at) >= yearStart && new Date(o.created_at) < yearEnd;
    if (mCreated !== null && createdInYear) {
      monthly[mCreated].dossiers++;
    }

    // Montant facturé → date de facturation si disponible, sinon created_at
    if (BILLED_STATUTS.includes(o.statut)) {
      const mFact = monthOf(o.dateFACTURE) ?? (createdInYear ? mCreated : null);
      const factInYear = o.dateFACTURE
        ? new Date(o.dateFACTURE) >= yearStart && new Date(o.dateFACTURE) < yearEnd
        : createdInYear;
      if (mFact !== null && factInYear) {
        monthly[mFact].montant += o.montantCalcule ?? 0;
      }
    }

    // Demandes reçues = tout dossier créé dans l'année (instruction = création du dossier)
    if (createdInYear && mCreated !== null) {
      monthly[mCreated].demandes++;
    }

    // AOT émises
    const aotDate = o.aotDate ? new Date(o.aotDate) : null;
    if (o.aotFinalPath || o.aotSigned) {
      if (aotDate && aotDate >= yearStart && aotDate < yearEnd) {
        monthly[aotDate.getMonth()].aot++;
      } else if (createdInYear && mCreated !== null) {
        monthly[mCreated].aot++;
      }
    }
  }

  return { aotEmises, dossiersFactures, montantFacture, facturesEmises, dossiersEnCours, total, monthly };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentYear = new Date().getFullYear();
  const yearStart   = new Date(currentYear, 0, 1);
  const yearEnd     = new Date(currentYear + 1, 0, 1);

  const [chantier, tournage, commerce, tlpe, allTiers] = await Promise.all([
    kpisForType({ type: 'CHANTIER', isArchived: false, created_at: { gte: yearStart, lt: yearEnd } }, currentYear),
    kpisForType({ type: 'TOURNAGE', isArchived: false, created_at: { gte: yearStart, lt: yearEnd } }, currentYear),
    kpisForType({ type: 'COMMERCE', anneeTaxation: currentYear }, currentYear),
    kpisForType({ type: 'TLPE',     anneeTaxation: currentYear }, currentYear),
    // All tiers created before end of year, to compute cumulative evolution
    (prisma as any).tiers.findMany({
      where: { created_at: { lt: yearEnd } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  // Cumulative tiers per month: total existing at end of each month
  const tiersBeforeYear = allTiers.filter((t: any) => new Date(t.created_at) < yearStart).length;
  const tiersMonthly = MONTH_LABELS.map((month, m) => {
    const endOfMonth = new Date(currentYear, m + 1, 0, 23, 59, 59);
    const cumulative = allTiers.filter((t: any) => new Date(t.created_at) <= endOfMonth).length;
    const newThisMonth = allTiers.filter((t: any) => {
      const d = new Date(t.created_at);
      return d >= new Date(currentYear, m, 1) && d < new Date(currentYear, m + 1, 0, 23, 59, 59);
    }).length;
    return { month, total: cumulative, nouveaux: newThisMonth };
  });

  return NextResponse.json({ year: currentYear, chantier, tournage, commerce, tlpe, tiersMonthly });
}
