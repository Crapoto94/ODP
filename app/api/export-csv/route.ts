import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const occupations = await prisma.occupation.findMany({
      include: { tiers: true },
      orderBy: { created_at: 'desc' },
    });

    const header = 'id,tiers,type,surface,dateDebut,dateFin,adresse,montant,statut\n';
    const csv = occupations.map(o => {
      return `${o.id},"${o.tiers.nom}",${o.type},${o.surface},${o.dateDebut},${o.dateFin},"${o.adresse}",${o.montantCalcule},${o.statut}`;
    }).join('\n');

    return new Response(header + csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="export-odp.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
