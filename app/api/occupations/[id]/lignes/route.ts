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

function calculateQ2(u2: string, start: Date | null, end: Date | null, startC: Date | null, endC: Date | null) {
  const s = startC || start;
  const e = endC || end;
  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;

  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // Inclusive

  const unit = (u2 || '').toLowerCase();
  if (unit.includes('an')) return 1;
  if (unit.includes('10 jour')) return Math.ceil(diffDays / 10);
  if (unit.includes('mois')) return Math.ceil(diffDays / 31);
  if (unit.includes('jour')) return diffDays;
  return 1;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const occupationId = parseInt(paramId);
    const body = await request.json();
    const { articleId, quantite1, quantite2, dateDebut, dateFin, dateDebutConstatee, dateFinConstatee, photos } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: occupationId }
    });

    const article = await (prisma as any).article.findUnique({
      where: { id: parseInt(articleId) },
      include: { modeTaxation: true }
    });

    const baseMontant = article?.montant || 0;
    const mode = (article?.modeTaxation?.nom || '').toLowerCase();
    // Look for a temporal unit in the full mode string
    let u2Label = '';
    if (mode.includes('an')) u2Label = 'an';
    else if (mode.includes('mois')) u2Label = 'mois';
    else if (mode.includes('10 jour')) u2Label = '10 jour';
    else if (mode.includes('jour')) u2Label = 'jour';


    let q2 = parseFloat(quantite2 || '1');
    if (occupation?.type === 'COMMERCE') {
      q2 = 1;
    } else if (occupation?.type === 'CHANTIER') {
      q2 = calculateQ2(
        u2Label, 
        dateDebut ? new Date(dateDebut) : null, 
        dateFin ? new Date(dateFin) : null,
        dateDebutConstatee ? new Date(dateDebutConstatee) : null,
        dateFinConstatee ? new Date(dateFinConstatee) : null
      );
    }

    const q1 = parseFloat(quantite1 || '0');
    const calculatedMontant = baseMontant * q1 * q2;

    const ligne = await (prisma as any).ligneOccupation.create({
      data: {
        occupationId,
        articleId: parseInt(articleId),
        quantite1: q1,
        quantite2: q2,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        dateDebutConstatee: dateDebutConstatee ? new Date(dateDebutConstatee) : null,
        dateFinConstatee: dateFinConstatee ? new Date(dateFinConstatee) : null,
        montant: calculatedMontant,
        photos: photos || null
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
