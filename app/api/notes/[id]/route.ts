import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer as hasPermission } from '@/lib/permissions-server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MODIFY_DOSSIER')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
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
