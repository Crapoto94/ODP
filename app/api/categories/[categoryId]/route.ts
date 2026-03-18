import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  try {
    const id = parseInt(categoryId);
    const body = await request.json();
    const { nom, couleur } = body;

    const categorie = await (prisma as any).categorie.update({
      where: { id },
      data: {
        nom: nom || undefined,
        couleur: couleur === null ? null : (couleur || undefined)
      }
    });

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  try {
    const id = parseInt(categoryId);
    
    // Check if category has children
    const hasChildren = await (prisma as any).categorie.findFirst({
      where: { parentId: id }
    });
    
    if (hasChildren) {
      return NextResponse.json({ error: 'Cannot delete category with children' }, { status: 400 });
    }

    // Check if category has articles
    const hasArticles = await (prisma as any).article.findFirst({
      where: { categorieId: id }
    });
    
    if (hasArticles) {
      return NextResponse.json({ error: 'Cannot delete category with associated articles' }, { status: 400 });
    }

    await (prisma as any).categorie.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
