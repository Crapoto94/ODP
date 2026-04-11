import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOccupationTotal, calculateQ2 } from '@/lib/tlpe-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { articleId, quantite1, quantite2, dateDebut, dateFin, dateDebutConstatee, dateFinConstatee, photos, montant: providedMontant } = body;

    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!occupation) {
      return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });
    }

    const article = await (prisma as any).article.findUnique({
      where: { id: parseInt(articleId) },
      include: { modeTaxation: true }
    });

    const mode = article?.modeTaxation?.nom || '';
    const parts = mode.split('/').map((p: string) => p.trim()).filter(Boolean);
    const temporalUnits = ['mois', 'jour', 'an', '10 jour'];
    let u2Label = parts[1] || '';
    if (parts.length >= 3) {
      u2Label = parts.find((p: string) => temporalUnits.some(tu => p.toLowerCase().includes(tu))) || parts[1];
    }

    const isDayUnit = u2Label?.toLowerCase().includes('jour');
    const q1 = parseFloat(quantite1 || '0');
    let q2 = parseFloat(quantite2 || '0');
    
    // Auto-calculate for day units OR if missing
    if (!q2 || isDayUnit) {
       q2 = calculateQ2(u2Label, 
          dateDebut ? new Date(dateDebut) : null, 
          dateFin ? new Date(dateFin) : null,
          dateDebutConstatee ? new Date(dateDebutConstatee) : null,
          dateFinConstatee ? new Date(dateFinConstatee) : null
       );
    }

    const baseMontant = article?.montant || 0;
    const finalMontant = (occupation.type === 'TLPE' && providedMontant !== undefined)
      ? parseFloat(providedMontant)
      : (baseMontant * q1 * q2);

    const ligne = await (prisma as any).ligneOccupation.create({
      data: {
        occupationId: parseInt(id),
        articleId: parseInt(articleId),
        quantite1: q1,
        quantite2: q2,
        montant: finalMontant,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        dateDebutConstatee: dateDebutConstatee ? new Date(dateDebutConstatee) : null,
        dateFinConstatee: dateFinConstatee ? new Date(dateFinConstatee) : null,
        photos: photos || ''
      }
    });

    await updateOccupationTotal(parseInt(id));
    return NextResponse.json(ligne);
  } catch (error) {
    console.error('Error adding line:', error);
    return NextResponse.json({ error: 'Failed to add line' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lignes = await (prisma as any).ligneOccupation.findMany({
      where: { occupationId: parseInt(id) },
      include: { article: { include: { modeTaxation: true } } }
    });
    return NextResponse.json(lignes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}
