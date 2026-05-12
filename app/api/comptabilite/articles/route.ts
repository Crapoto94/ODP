import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const articles = await (prisma as any).article.findMany({
      orderBy: { designation: 'asc' },
      include: { modeTaxation: true, categorie: true }
    });

    return NextResponse.json(articles);
  } catch (err: any) {
    console.error('Comptabilité GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const article = await (prisma as any).article.create({
      data: {
        designation: body.designation,
        numero: body.numero,
        chapitre: body.chapitre,
        codeInterne: body.codeInterne,
        fonction: body.fonction,
        gestionnaire: body.gestionnaire,
        nature: body.nature,
        sens: body.sens,
        structure: body.structure,
        typeMouvement: body.typeMouvement,
        montant: body.montant || 0,
        annee: new Date().getFullYear()
      },
      include: { modeTaxation: true }
    });

    return NextResponse.json(article);
  } catch (err: any) {
    console.error('Comptabilité POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
