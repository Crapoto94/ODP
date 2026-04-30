import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all TLPE and COMMERCE occupations with their tiers
    const occupations = await (prisma as any).occupation.findMany({
      where: {
        type: {
          in: ['TLPE', 'COMMERCE']
        }
      },
      select: {
        id: true,
        type: true,
        anneeTaxation: true,
        dateDebut: true,
        dateFin: true,
        tiers: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            email: true,
          }
        }
      }
    });

    // Deduplicate commerces and collect years by type
    const commercesMap = new Map<number, any>();

    occupations.forEach(occ => {
      if (occ.tiers) {
        const tierId = occ.tiers.id;
        const year = occ.type === 'TLPE' || occ.type === 'COMMERCE'
          ? occ.anneeTaxation
          : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : null);

        if (commercesMap.has(tierId)) {
          const commerce = commercesMap.get(tierId);
          if (occ.type === 'TLPE') {
            if (!commerce.tlpeYears.includes(year)) {
              commerce.tlpeYears.push(year);
            }
            commerce.tlpeCount++;
          } else if (occ.type === 'COMMERCE') {
            if (!commerce.commerceYears.includes(year)) {
              commerce.commerceYears.push(year);
            }
            commerce.commerceCount++;
          }
        } else {
          const tlpeYears = occ.type === 'TLPE' ? [year] : [];
          const commerceYears = occ.type === 'COMMERCE' ? [year] : [];
          commercesMap.set(tierId, {
            id: occ.tiers.id,
            nom: occ.tiers.nom,
            adresse: occ.tiers.adresse,
            email: occ.tiers.email,
            tlpeYears: tlpeYears.filter(Boolean),
            commerceYears: commerceYears.filter(Boolean),
            tlpeCount: occ.type === 'TLPE' ? 1 : 0,
            commerceCount: occ.type === 'COMMERCE' ? 1 : 0
          });
        }
      }
    });

    // Convert to array and sort by name
    const commerces = Array.from(commercesMap.values())
      .sort((a, b) => a.nom.localeCompare(b.nom));

    return NextResponse.json(commerces);
  } catch (err: any) {
    console.error('[commerces]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
