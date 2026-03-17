import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const annee = searchParams.get('annee');
    
    const articles = await (prisma as any).article.findMany({
      where: annee ? { annee: parseInt(annee) } : {},
      include: { 
        categorie: {
          include: { parent: true }
        },
        modeTaxation: true
      },
      orderBy: { designation: 'asc' },
    });
    return NextResponse.json(articles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, numero, designation, categorieId, modeTaxationId, annee, montant, notes } = body;

    let article;
    if (id) {
      article = await (prisma as any).article.update({
        where: { id: parseInt(id) },
        data: {
          numero,
          designation,
          categorieId: categorieId ? parseInt(categorieId) : undefined,
          modeTaxationId: modeTaxationId ? parseInt(modeTaxationId) : undefined,
          annee: parseInt(annee),
          montant: parseFloat(montant) || 0,
          notes
        }
      });
    } else {
      article = await (prisma as any).article.create({
        data: {
          numero,
          designation,
          categorieId: categorieId ? parseInt(categorieId) : null,
          modeTaxationId: modeTaxationId ? parseInt(modeTaxationId) : null,
          annee: parseInt(annee),
          montant: parseFloat(montant) || 0,
          notes
        }
      });
    }

    return NextResponse.json(article);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await (prisma as any).article.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
