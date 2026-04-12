import { NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/postgresClient';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pgPrisma = await getPostgresClient();
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const item = await pgPrisma.backlogItem.update({
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
    const pgPrisma = await getPostgresClient();
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await pgPrisma.backlogItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/backlog/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
