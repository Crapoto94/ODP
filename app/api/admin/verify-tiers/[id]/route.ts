import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSiretInfo } from '@/lib/insee';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tier = await (prisma as any).tiers.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tier || !tier.siret) {
      return NextResponse.json({ error: 'Tiers non trouvé ou sans SIRET' }, { status: 404 });
    }

    try {
      const info = await fetchSiretInfo(tier.siret);
      
      if (info) {
        const status = info.etat_administratif || 'Inconnu';
        
        await (prisma as any).tiers.update({
          where: { id: tier.id },
          data: { etatAdministratif: status }
        });

        return NextResponse.json({ 
          success: true, 
          status,
          name: tier.nom 
        });
      } else {
        return NextResponse.json({ error: 'Aucune info trouvée pour ce SIRET' }, { status: 404 });
      }
    } catch (err: any) {
      console.error(`[Verify Single] Error for Tiers ${id}:`, err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Verify Single Tiers Global Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
