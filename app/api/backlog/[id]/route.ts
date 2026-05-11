import { NextResponse } from 'next/server';
import { prismaShared } from '@/lib/prisma-shared';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();

    let userRole = '';
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;
      if (sessionToken) {
        const session = await decrypt(sessionToken);
        userRole = session?.role || '';
      }
    } catch (e) {
      console.error('[PATCH /api/backlog/[id]] Error decrypting session:', e);
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can modify backlog items' }, { status: 403 });
    }

    const item = await prismaShared.backlogItem.update({
      where: { id },
      data: body
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('[PATCH /api/backlog/[id]]', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prismaShared.backlogItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/backlog/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
