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
      include: {
        tiers: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            email: true,
            codePostal: true,
            ville: true,
          }
        }
      },
      select: {
        id: true,
        tiers: true,
      }
    });

    // Deduplicate commerces and count occupations
    const commercesMap = new Map<number, any>();

    occupations.forEach(occ => {
      if (occ.tiers) {
        const tierId = occ.tiers.id;
        if (commercesMap.has(tierId)) {
          commercesMap.get(tierId).occupationCount++;
        } else {
          commercesMap.set(tierId, {
            id: occ.tiers.id,
            nom: occ.tiers.nom,
            adresse: occ.tiers.adresse,
            email: occ.tiers.email,
            codePostal: occ.tiers.codePostal,
            ville: occ.tiers.ville,
            occupationCount: 1
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
