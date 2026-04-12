import { NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/postgresClient';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pgPrisma = await getPostgresClient();
    const { id: backlogItemId } = await params;
    const comments = await pgPrisma.backlogComment.findMany({
      where: { backlogItemId: parseInt(backlogItemId) },
      orderBy: { created_at: 'asc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('[GET /api/backlog/[id]/comments]', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pgPrisma = await getPostgresClient();
    const { id: backlogItemId } = await params;
    const session = await getSession();
    const body = await req.json();
    
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const comment = await pgPrisma.backlogComment.create({
      data: {
        backlogItemId: parseInt(backlogItemId),
        content: body.content,
        author: session ? `${session.prenom} ${session.nom}` : 'Système'
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[POST /api/backlog/[id]/comments]', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
