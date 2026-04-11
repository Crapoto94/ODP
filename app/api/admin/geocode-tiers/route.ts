import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Find all tiers without coordinates
    const tiers = await (prisma as any).tiers.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      take: 100 // Process in batches of 100 to avoid long timeouts
    });

    if (tiers.length === 0) {
      return NextResponse.json({ message: "Aucun tiers à géocoder." });
    }

    let success = 0;
    let failed = 0;

    for (const t of tiers) {
      if (!t.adresse) {
        failed++;
        continue;
      }

      try {
        const cleanAddress = t.adresse.replace(/\n/g, ' ');
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanAddress)}&limit=1`);
        const data = await res.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].geometry.coordinates;
          await (prisma as any).tiers.update({
            where: { id: t.id },
            data: { latitude: lat, longitude: lng }
          });
          success++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error(`Geocoding failed for tier ${t.id}:`, e);
        failed++;
      }
      
      // Small sleep to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return NextResponse.json({ 
      stats: {
        totalProcessed: tiers.length,
        success,
        failed
      }
    });

  } catch (error: any) {
    console.error('Geocoding route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
