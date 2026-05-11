import { NextResponse } from 'next/server';
import { prismaShared } from '@/lib/prisma-shared';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // 1. Check if version has items
    const version = await prismaShared.versionRelease.findUnique({
      where: { id },
      include: { _count: { select: { backlogItems: true } } }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version non trouvée' }, { status: 404 });
    }

    if (version._count.backlogItems > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer cette version car elle contient encore des éléments du backlog. Videz-la d\'abord.' 
      }, { status: 400 });
    }

    // 2. Delete version
    await prismaShared.versionRelease.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/releases/[id]]', error);
    return NextResponse.json({ error: 'Échec de la suppression de la version' }, { status: 500 });
  }
}
