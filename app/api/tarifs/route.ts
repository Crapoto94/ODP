import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const annee = parseInt(searchParams.get('annee') || '2025');
  const articleId = searchParams.get('articleId');

  try {
    const where: any = { annee };
    if (articleId) where.articleId = parseInt(articleId);

    const tarifs = await (prisma as any).tarif.findMany({
      where,
      include: {
        article: true,
        modeTaxation: true
      }
    });

    return NextResponse.json(tarifs);
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    return NextResponse.json({ error: 'Failed to fetch tariffs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, modeTaxationId, annee, montant, notes, designation, categorieId, numero } = body;

    let finalArticleId = articleId ? parseInt(articleId) : null;

    // If no articleId but we have designation, create the article first
    if (!finalArticleId && designation) {
      const newArticle = await (prisma as any).article.create({
        data: {
          numero: numero || null,
          designation,
          categorieId: categorieId ? parseInt(categorieId) : null,
          annee: annee || 2025
        }
      });
      finalArticleId = newArticle.id;
    }

    if (!finalArticleId) {
      return NextResponse.json({ error: 'Article ID or Designation is required' }, { status: 400 });
    }

    const tarif = await (prisma as any).tarif.create({
      data: {
        articleId: finalArticleId,
        modeTaxationId: modeTaxationId ? parseInt(modeTaxationId) : null,
        annee: annee || 2025,
        montant: parseFloat(montant),
        notes: notes || null
      }
    });

    return NextResponse.json(tarif);
  } catch (error) {
    console.error('Error creating tariff:', error);
    return NextResponse.json({ error: 'Failed to create tariff' }, { status: 500 });
  }
}
