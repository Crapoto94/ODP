import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    console.log('[GET Occupations] Starting fetch');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const minStatus = searchParams.get('minStatus');
    const type = searchParams.get('type');
    const anneeTaxation = searchParams.get('anneeTaxation');
    const tiersId = searchParams.get('tiersId');
    const excludeArchived = searchParams.get('excludeArchived') === 'true';
    const view = searchParams.get('view') || 'ACTIVE';

    const where: any = {};

    // Status hierarchy for minStatus filtering
    const statusHierarchy: Record<string, string[]> = {
      'FACTURE': ['FACTURE', 'FACTURÉ', 'TITRE', 'TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'],
      'FACTURÉ': ['FACTURÉ', 'TITRE', 'TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'],
      'TITRE': ['TITRE', 'TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'],
      'TITRÉ': ['TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'],
      'PAYE': ['PAYE', 'PAYÉ', 'CLOS'],
      'PAYÉ': ['PAYÉ', 'CLOS'],
      'CLOS': ['CLOS']
    };

    if (minStatus && statusHierarchy[minStatus]) {
      where.statut = { in: statusHierarchy[minStatus] };
    } else if (status && status !== 'ACTIVE' && status !== 'ARCHIVE') {
      where.statut = status;
    }

    if (type) where.type = type;
    if (anneeTaxation) where.anneeTaxation = parseInt(anneeTaxation);
    if (tiersId) where.tiersId = parseInt(tiersId);

    // Handle archive view filtering
    if (view === 'ARCHIVE') {
      where.isArchived = true;
    } else if (view === 'ACTIVE' || excludeArchived) {
      where.isArchived = false;
    }

    console.log('[GET Occupations] Filter:', where);

    // Fetch occupations with minimal includes
    console.log('[GET Occupations] Fetching occupations with tiers and lignes...');
    const occupations = await (prisma as any).occupation.findMany({
      where,
      include: {
        tiers: {
          select: {
            id: true,
            nom: true,
            code_sedit: true,
            etatAdministratif: true,
            latitude: true,
            longitude: true
          }
        },
        lignes: {
          include: {
            article: true
          }
        },
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5000 // Increased limit for map view
    });

    console.log('[GET Occupations] ✅ Success! Found:', occupations.length, 'occupations');
    if (occupations.length > 0) {
      console.log('[GET Occupations] First occupation lignes count:', occupations[0].lignes?.length || 0);
      if (occupations[0].lignes) {
        occupations[0].lignes.forEach((ligne: any, idx: number) => {
          console.log(`[GET Occupations] Ligne ${idx}:`, ligne.article?.designation, 'montant:', ligne.montant);
        });
      }
      console.log('[GET Occupations] First occupation sample:', JSON.stringify(occupations[0], null, 2).substring(0, 300));
    }

    // Background geocoding (non-blocking, fire and forget)
    setTimeout(() => {
      const missing = occupations.filter((o: any) => !o.latitude || !o.longitude).slice(0, 5);
      if (missing.length > 0) {
        console.log('[GET Occupations] Starting background geocoding for', missing.length, 'items');
        missing.forEach(async (o: any) => {
          try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(o.adresse)}&limit=1`);
            if (!res.ok) throw new Error('Geocoding API error');
            const data = await res.json();
            if (data.features?.length > 0) {
              const [lng, lat] = data.features[0].geometry.coordinates;
              await (prisma as any).occupation.update({
                where: { id: o.id },
                data: { latitude: lat, longitude: lng }
              });
              console.log('[GET Occupations] Geocoded:', o.adresse);
            }
          } catch (e) {
            console.warn('[GET Occupations] Geocoding error for', o.adresse);
          }
        });
      }
    }, 100);

    return NextResponse.json(occupations);
  } catch (error: any) {
    console.error('[GET Occupations] Error:', error.message);
    console.error('[GET Occupations] Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log('[POST Occupations] Starting creation');

    const body = await req.json();
    const {
      nom,
      tiersId,
      type,
      dateDebut,
      dateFin,
      dateAlerte,
      anneeTaxation,
      adresse,
      latitude,
      longitude,
      description,
      photos,
      isCourtMetrage,
      isExempt,
      isNotAuthorized,
      isAgissantPourBillable,
      agissantPour
    } = body;

    console.log('[POST Occupations] Body:', { tiersId, type, adresse });

    if (!tiersId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    if (type !== 'COMMERCE' && type !== 'TLPE' && (!dateDebut || !dateFin)) {
      return NextResponse.json({ error: 'Dates required for non-commerce/TLPE types' }, { status: 400 });
    }
    if ((type === 'COMMERCE' || type === 'TLPE') && !anneeTaxation) {
      return NextResponse.json({ error: 'Taxation year required for commerce/TLPE types' }, { status: 400 });
    }

    const occupation = await (prisma as any).occupation.create({
      data: {
        nom,
        tiersId: parseInt(tiersId),
        type,
        statut: 'EN_ATTENTE',
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        dateAlerte: dateAlerte ? new Date(dateAlerte) : null,
        anneeTaxation: anneeTaxation ? parseInt(anneeTaxation) : null,
        adresse,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        description,
        photos,
        montantCalcule: 0,
        agissantPour,
        isAgissantPourBillable: !!isAgissantPourBillable,
        isCourtMetrage: isCourtMetrage ? !!isCourtMetrage : false,
        isExempt: isExempt ? !!isExempt : false,
        isNotAuthorized: isNotAuthorized ? !!isNotAuthorized : false
      }
    });

    console.log('[POST Occupations] Created occupation:', occupation.id);

    return NextResponse.json(occupation);
  } catch (error: any) {
    console.error('[POST Occupations] Error:', error);
    console.error('[POST Occupations] Stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
