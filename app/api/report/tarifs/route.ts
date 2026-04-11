import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { articleId, toYear, newMontant } = await req.json();

    if (!articleId || !toYear) {
      return NextResponse.json({ error: 'ID article ou annee manquants.' }, { status: 400 });
    }

    const oldArticle = await (prisma as any).article.findUnique({
      where: { id: parseInt(articleId) }
    });

    if (!oldArticle) {
      return NextResponse.json({ error: 'Article original introuvable.' }, { status: 404 });
    }

    // Check if already exists in toYear
    let newArticle = await (prisma as any).article.findFirst({
      where: {
        annee: parseInt(toYear),
        designation: oldArticle.designation,
        numero: oldArticle.numero
      }
    });

    if (!newArticle) {
      newArticle = await (prisma as any).article.create({
        data: {
          numero: oldArticle.numero,
          designation: oldArticle.designation,
          categorieId: oldArticle.categorieId,
          modeTaxationId: oldArticle.modeTaxationId,
          annee: parseInt(toYear),
          montant: newMontant !== undefined ? parseFloat(newMontant) : oldArticle.montant,
          notes: oldArticle.notes,
          chapitre: oldArticle.chapitre,
          codeInterne: oldArticle.codeInterne,
          fonction: oldArticle.fonction,
          gestionnaire: oldArticle.gestionnaire,
          nature: oldArticle.nature,
          sens: oldArticle.sens,
          structure: oldArticle.structure,
          typeMouvement: oldArticle.typeMouvement
        }
      });
    }

    return NextResponse.json({ success: true, article: newArticle });

  } catch (err: any) {
    console.error('Erreur duplicate tariff:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
