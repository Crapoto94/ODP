import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await (prisma as any).categorie.findMany({
      where: { niveau: 1 },
      include: {
        subs: {
          include: {
            subs: true
          }
        }
      },
      orderBy: { nom: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, parentId, niveau, couleur } = body;

    if (!nom || niveau === undefined) {
      return NextResponse.json({ error: 'Nom and niveau are required' }, { status: 400 });
    }

    const categorie = await (prisma as any).categorie.create({
      data: {
        nom,
        niveau: parseInt(niveau),
        parentId: parentId ? parseInt(parentId) : null,
        couleur: couleur || null
      }
    });

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
