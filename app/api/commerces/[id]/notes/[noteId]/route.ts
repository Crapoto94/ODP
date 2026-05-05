import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: paramId, noteId } = await params;
    const tiersId = parseInt(paramId);
    const noteIdNum = parseInt(noteId);

    const note = await (prisma as any).note.findUnique({
      where: { id: noteIdNum }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (note.tiersId !== tiersId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await (prisma as any).note.delete({
      where: { id: noteIdNum }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
