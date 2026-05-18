import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOccupationTotal } from '@/lib/tlpe-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, montant } = body;

    if (!description || !montant) {
      return NextResponse.json({ error: 'Description et montant requis' }, { status: 400 });
    }

    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!occupation) {
      return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });
    }

    // Get or create a special "DEGRÈVEMENT" article
    let article = await (prisma as any).article.findFirst({
      where: {
        designation: 'DEGRÈVEMENT',
        annee: new Date().getFullYear()
      }
    });

    if (!article) {
      article = await (prisma as any).article.create({
        data: {
          numero: 'DEGREV',
          designation: 'DEGRÈVEMENT',
          annee: new Date().getFullYear(),
          montant: 0,
          chapitre: '',
          codeInterne: 'DEGREV',
          fonction: '',
          gestionnaire: '',
          nature: '',
          sens: '',
          structure: '',
          typeMouvement: ''
        }
      });
    }

    const ligne = await (prisma as any).ligneOccupation.create({
      data: {
        occupationId: parseInt(id),
        articleId: article.id,
        quantite1: 1,
        quantite2: 1,
        montant: -Math.abs(parseFloat(montant)),
        note: description
      }
    });

    await updateOccupationTotal(parseInt(id));
    return NextResponse.json(ligne);
  } catch (error) {
    console.error('Error adding degrèvement:', error);
    return NextResponse.json({ error: 'Failed to add degrèvement' }, { status: 500 });
  }
}
