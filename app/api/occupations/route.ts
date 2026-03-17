import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const occupations = await (prisma as any).occupation.findMany({
      include: { 
        tiers: true,
        lignes: {
          include: { article: true }
        },
        _count: {
          select: { notes: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });

    // Background geocoding
    const missing = occupations.filter((o: any) => !o.latitude || !o.longitude);
    if (missing.length > 0) {
      Promise.all(missing.slice(0, 5).map(async (o: any) => {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(o.adresse)}&limit=1`);
          const data = await res.json();
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            await (prisma as any).occupation.update({
              where: { id: o.id },
              data: { latitude: lat, longitude: lng }
            });
          }
        } catch (e) {}
      })).catch(() => {});
    }

    return NextResponse.json(occupations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      nom,
      tiersId, 
      type, 
      dateDebut, 
      dateFin, 
      adresse, 
      latitude, 
      longitude, 
      description,
      photos
    } = body;

    if (!tiersId || !type || !dateDebut || !dateFin) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const occupation = await (prisma as any).occupation.create({
      data: {
        nom,
        tiersId: parseInt(tiersId),
        type,
        statut: 'EN_ATTENTE',
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        adresse,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        description,
        photos,
        montantCalcule: 0
      }
    });

    return NextResponse.json(occupation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
