import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const occupations = await (prisma as any).occupation.findMany({
      include: { tiers: true, lignes: true },
      orderBy: { created_at: 'desc' },
    });

    const header = 'id,tiers,type,surface,dateDebut,dateFin,adresse,montant,statut\n';
    const csv = occupations.map((o: any) => {
      const surface = o.lignes?.reduce((sum: number, l: any) => sum + (l.quantite1 || 0), 0) || 0;
      return `${o.id},"${o.tiers.nom}",${o.type},${surface},${o.dateDebut},${o.dateFin},"${o.adresse}",${o.montantCalcule},${o.statut}`;
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
