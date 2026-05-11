import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Seul un administrateur peut supprimer une note' }, { status: 403 });
    }

    const { id } = await params;
    const noteId = parseInt(id);

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await (prisma as any).note.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Note Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
