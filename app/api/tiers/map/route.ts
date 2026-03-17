import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tiers = await (prisma as any).tiers.findMany();

    // Background geocoding for missing coords
    const missing = tiers.filter((t: any) => !t.latitude || !t.longitude);
    if (missing.length > 0) {
      Promise.all(missing.slice(0, 5).map(async (t: any) => {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(t.adresse)}&limit=1`);
          const data = await res.json();
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            await (prisma as any).tiers.update({
              where: { id: t.id },
              data: { latitude: lat, longitude: lng }
            });
          }
        } catch (e) {}
      })).catch(() => {});
    }

    return NextResponse.json(tiers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
