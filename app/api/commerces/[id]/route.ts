import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const tierId = parseInt(id);

    // Get tiers info
    const tiers = await (prisma as any).tiers.findUnique({
      where: { id: tierId }
    });

    if (!tiers) {
      return NextResponse.json({ error: 'Commerce not found' }, { status: 404 });
    }

    // Get all TLPE and COMMERCE occupations for this tiers (all years)
    const occupations = await (prisma as any).occupation.findMany({
      where: {
        tiersId: tierId,
        type: 'COMMERCE'
      },
      include: {
        lignes: {
          select: {
            id: true,
            montant: true,
            quantite1: true,
            dateDebut: true,
            dateFin: true,
            deletedAt: true,
            article: {
              select: {
                id: true,
                designation: true,
                montant: true,
                modeTaxation: {
                  select: {
                    nom: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        anneeTaxation: 'desc'
      }
    });

    // Create timeline events from occupations
    const timelineEvents: any[] = [];

    // Group dispositifs by year and type
    const dispositifsMap = new Map<string, any>();
    const yearsSet = new Set<number>();

    occupations.forEach((occ: any) => {
      const year = occ.type === 'TLPE' || occ.type === 'COMMERCE'
        ? occ.anneeTaxation
        : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : null);

      if (year) {
        yearsSet.add(year);
      }

      // Create timeline event for this occupation
      const dispositifs: any[] = [];
      let totalAmount = 0;

      occ.lignes.forEach((ligne: any) => {
        // Filtrer les lignes supprimées et les dégrèvements
        if (ligne.article && !ligne.deletedAt && ligne.article.designation !== 'DEGRÈVEMENT') {
          dispositifs.push({
            nom: ligne.article.designation,
            id: ligne.article.id,
            count: 1
          });
          // Utiliser le montant stocké dans la ligne (qui peut être négatif pour les dégrèvements)
          // Si ligne.montant n'existe pas, calculer à partir de article.montant
          const amount = ligne.montant !== undefined && ligne.montant !== null
            ? ligne.montant
            : ((ligne.article.montant || 0) * (ligne.quantite1 || 0));
          totalAmount += amount;
        } else if (ligne.article && !ligne.deletedAt && ligne.article.designation === 'DEGRÈVEMENT') {
          // Retrancher les dégrèvements du montant total
          console.log('[API] Dégrèvement trouvé:', ligne.article.designation, 'montant:', ligne.montant);
          const amount = ligne.montant !== undefined && ligne.montant !== null
            ? ligne.montant
            : 0;
          totalAmount += amount;
        }
      });

      console.log('[API] Year', year, 'Occupation', occ.id, 'Total amount:', totalAmount, 'Dispositifs:', dispositifs.length);

      if (dispositifs.length > 0) {
        timelineEvents.push({
          id: occ.id,
          date: occ.dateDebut || new Date().toISOString(),
          type: occ.type,
          year: year,
          status: occ.statut,
          dispositifs: dispositifs,
          totalDispositions: dispositifs.length,
          amount: totalAmount
        });
      }

      occ.lignes.forEach((ligne: any) => {
        if (ligne.article) {
          const key = `${year}-${ligne.article.designation}`;
          const nom = ligne.article.designation;

          if (!dispositifsMap.has(key)) {
            dispositifsMap.set(key, {
              id: ligne.article.id,
              nom,
              year,
              count: 0,
              montant: ligne.article.montant || 0,
              dateDebut: ligne.dateDebut,
              dateFin: ligne.dateFin,
              occupationType: occ.type
            });
          }

          const item = dispositifsMap.get(key);
          item.count += 1;
          // Keep track of all occupation types this dispositif appears in
          if (!item.occupationTypes) {
            item.occupationTypes = new Set();
          }
          item.occupationTypes.add(occ.type);
        }
      });
    });

    // Group dispositifs by year individually (no grouping by designation for timeline precision)
    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const dispositifsByYear = new Map<number, any[]>();

    // Initialize all years
    years.forEach(y => dispositifsByYear.set(y, []));

    occupations.forEach((occ: any) => {
      const year = occ.type === 'TLPE' || occ.type === 'COMMERCE'
        ? occ.anneeTaxation
        : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : null);

      if (!year) return;

      occ.lignes.forEach((ligne: any) => {
        // Inclure tous les dispositifs et dégrèvements (non supprimés)
        if (ligne.article && !ligne.deletedAt) {
          const yearDisps = dispositifsByYear.get(year);
          if (yearDisps) {
            yearDisps.push({
              id: ligne.id,
              nom: ligne.article.designation,
              montant: ligne.montant !== undefined && ligne.montant !== null ? ligne.montant : (ligne.article.montant || 0),
              unite: ligne.article.modeTaxation?.nom || '',
              dateDebut: ligne.dateDebut,
              dateFin: ligne.dateFin,
              occupationType: occ.type,
              count: ligne.quantite1 || 1
            });
          }
        }
      });
    });

    // Sort each year's dispositifs alphabetically
    dispositifsByYear.forEach((disps, year) => {
      disps.sort((a, b) => a.nom.localeCompare(b.nom));
      console.log(`[API] Year ${year} dispositifsByYear:`, disps.length, 'items, total montant:', disps.reduce((sum, d) => sum + d.montant, 0));
      disps.forEach(d => {
        console.log(`  - ${d.nom}: montant=${d.montant}, count=${d.count}`);
      });
    });

    // Calculate amounts by year with status tracking
    const amountsByYear = new Map<number, { total: number; billed: number; statuses: string[] }>();

    timelineEvents.forEach(event => {
      const current = amountsByYear.get(event.year) || { total: 0, billed: 0, statuses: [] };
      current.total += event.amount;

      // Check if facturé (common statuses: FACTURÉ, FACTURED, PAID, etc.)
      const isBilled = event.status &&
        (event.status.toUpperCase().includes('FACTUR') ||
         event.status.toUpperCase().includes('PAYÉ') ||
         event.status.toUpperCase().includes('PAID'));

      if (isBilled) {
        current.billed += event.amount;
      }

      if (!current.statuses.includes(event.status)) {
        current.statuses.push(event.status);
      }

      amountsByYear.set(event.year, current);
    });

    // Sort timeline by date descending (most recent first)
    const sortedTimeline = timelineEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Create chart data for amounts with status
    const chartData = Array.from(years)
      .map(year => {
        const data = amountsByYear.get(year) || { total: 0, billed: 0, statuses: [] };
        const notBilled = data.total - data.billed;
        const billedPercentage = data.total > 0 ? (data.billed / data.total) * 100 : 0;

        return {
          year,
          billed: Math.max(0, data.billed),
          notBilled: Math.max(0, notBilled),
          total: data.total,
          amount: data.total,
          status: data.statuses.length === 1 ? data.statuses[0] : 'MIXED',
          billedPercentage: Math.round(billedPercentage)
        };
      })
      .sort((a, b) => a.year - b.year);

    return NextResponse.json({
      commerce: {
        id: tiers.id,
        nom: tiers.nom,
        adresse: tiers.adresse,
        email: tiers.email,
        telephone: tiers.telephone,
        statut: tiers.statut,
        observations: tiers.observations,
        photo: tiers.photo
      },
      occupationsCount: occupations.length,
      years,
      dispositifsByYear: Object.fromEntries(dispositifsByYear),
      totalDispositions: dispositifsMap.size,
      timeline: sortedTimeline,
      chartData: chartData
    });
  } catch (err: any) {
    console.error('[commerce-detail]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[PATCH-COMMERCE] Start', params);
    const session = await getSession();
    if (!session) {
      console.log('[PATCH-COMMERCE] No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('[PATCH-COMMERCE] Updating', id, body);

    const updated = await (prisma as any).tiers.update({
      where: { id: parseInt(id) },
      data: body
    });
    console.log('[PATCH-COMMERCE] Success');

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PATCH-COMMERCE] Error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
