import { NextResponse } from 'next/server';
import { calculateRedevance, CalculationParams } from '@/lib/fees';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, surface, dateDebut, dateFin, zone, isPME } = body;

    if (!type || !surface || !dateDebut || !dateFin) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const params: CalculationParams = {
      type,
      surface: parseFloat(surface),
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      zone,
      isPME
    };

    const montantTotal = calculateRedevance(params);

    return NextResponse.json({
      montantTotal,
      details: {
        type,
        surface,
        jours: Math.ceil((params.dateFin.getTime() - params.dateDebut.getTime()) / (1000 * 3600 * 24)) + 1,
        zone
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
