import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const occupationId = parseInt(paramId);
    const lignes = await (prisma as any).ligneOccupation.findMany({
      where: { occupationId },
      include: { 
        article: { 
          include: { modeTaxation: true } 
        } 
      }
    });
    return NextResponse.json(lignes);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const occupationId = parseInt(paramId);
    const body = await request.json();
    const { articleId, quantite1, quantite2, dateDebut, dateFin } = body;

    if (!articleId || !dateDebut || !dateFin) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Basic amount calculation: we'll use the price of the article for that year
    const article = await (prisma as any).article.findUnique({
      where: { id: parseInt(articleId) }
    });

    const baseMontant = article?.montant || 0;
    // Simple calc for now: Q1 * Q2 * Base. More complex date-logic will follow.
    const calculatedMontant = baseMontant * parseFloat(quantite1 || '1') * parseFloat(quantite2 || '1');

    const ligne = await (prisma as any).ligneOccupation.create({
      data: {
        occupationId,
        articleId: parseInt(articleId),
        quantite1: parseFloat(quantite1 || '0'),
        quantite2: parseFloat(quantite2 || '0'),
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        montant: calculatedMontant
      }
    });

    // Recalculate total for occupation
    const allLignes = await (prisma as any).ligneOccupation.findMany({
      where: { occupationId }
    });
    const total = allLignes.reduce((sum: number, l: any) => sum + (l.montant || 0), 0);
    await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: { montantCalcule: total }
    });

    return NextResponse.json(ligne);
  } catch (error) {
    console.error('Error creating line:', error);
    return NextResponse.json({ error: 'Failed to create line' }, { status: 500 });
  }
}
