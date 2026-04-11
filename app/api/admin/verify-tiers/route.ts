import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSiretInfo } from '@/lib/insee';

export async function POST(req: Request) {
  try {
    // 1. Fetch all tiers that have a SIRET
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

    // 2. Iterate and verify (Sequentially to avoid aggressive rate limiting)
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
      
      // Small pause if many to be kind to the API
      if (stats.verified % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ stats, closedBusinesses: details });
  } catch (error: any) {
    console.error('Verify Tiers Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
