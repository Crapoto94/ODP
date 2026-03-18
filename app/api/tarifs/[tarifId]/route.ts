import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tarifId: string }> }
) {
  const { tarifId } = await params;
  try {
    const body = await request.json();
    const id = parseInt(tarifId);
    const { montant, notes, modeTaxationId, designation, numero, categorieId } = body;

    const tarif = await (prisma as any).tarif.update({
      where: { id },
      data: {
        montant: parseFloat(montant),
        notes: notes === null ? null : notes || undefined,
        modeTaxationId: modeTaxationId === null ? null : (modeTaxationId ? parseInt(modeTaxationId) : undefined)
      },
      include: { article: true }
    });

    // If article details are provided, update the article as well
    if (designation !== undefined || numero !== undefined || categorieId !== undefined) {
      await (prisma as any).article.update({
        where: { id: tarif.articleId },
        data: {
          designation: designation || undefined,
          numero: numero || undefined,
          categorieId: categorieId ? parseInt(categorieId) : undefined
        }
      });
    }

    return NextResponse.json(tarif);
  } catch (error) {
    console.error('Error updating tariff:', error);
    return NextResponse.json({ error: 'Failed to update tariff' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tarifId: string }> }
) {
  const { tarifId } = await params;
  try {
    const id = parseInt(tarifId);
    await (prisma as any).tarif.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tariff:', error);
    return NextResponse.json({ error: 'Failed to delete tariff' }, { status: 500 });
  }
}
