import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSiretInfo } from '@/lib/insee';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tiersId = searchParams.get('id');

    if (!tiersId) {
      // No ID provided, do batch verification
      return await batchVerify();
    }

    // Verify single tiers
    const id = parseInt(tiersId);
    const tiers = await (prisma as any).tiers.findUnique({
      where: { id }
    });

    if (!tiers) {
      return NextResponse.json({ status: 'Inexistant' }, { status: 404 });
    }

    if (!tiers.siren && !tiers.siret) {
      return NextResponse.json({ status: tiers.etatAdministratif || 'Actif' });
    }

    const siret = tiers.siret || (tiers.siren + '00001');
    const sirenInfo = await fetchSiretInfo(siret);

    if (!sirenInfo) {
      return NextResponse.json({ status: tiers.etatAdministratif || 'Actif' });
    }

    return NextResponse.json({
      status: sirenInfo.etat_administratif || 'Actif',
      sirenInfo
    });
  } catch (err: any) {
    console.error('[VERIFY-TIERS-ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function batchVerify() {
  try {
    const tiers = await (prisma as any).tiers.findMany({
      where: {
        NOT: { siret: null }
      }
    });

    const stats = {
      total: tiers.length,
      verified: 0,
      active: 0,
      closed: 0,
      errors: 0
    };

    const details: any[] = [];

    for (const t of tiers) {
      if (!t.siret) continue;

      try {
        const info = await fetchSiretInfo(t.siret);

        if (info) {
          const status = info.etat_administratif || 'Inconnu';

          await (prisma as any).tiers.update({
            where: { id: t.id },
            data: { etatAdministratif: status }
          });

          stats.verified++;
          if (status === 'Actif') stats.active++;
          else {
            stats.closed++;
            details.push({
              id: t.id,
              nom: t.nom,
              siret: t.siret,
              status: status
            });
          }
        } else {
          stats.errors++;
        }
      } catch (err) {
        console.error(`[Verify] Error for Tiers ${t.id}:`, err);
        stats.errors++;
      }

      if (stats.verified % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ stats, closedBusinesses: details });
  } catch (error: any) {
    console.error('Batch Verify Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
