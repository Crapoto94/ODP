import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: backlogItemId } = await params;
    const comments = await (prisma as any).backlogComment.findMany({
      where: { backlogItemId: parseInt(backlogItemId) },
      orderBy: { created_at: 'asc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: backlogItemId } = await params;
    const session = await getSession();
    const body = await req.json();
    
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const comment = await (prisma as any).backlogComment.create({
      data: {
        backlogItemId: parseInt(backlogItemId),
        content: body.content,
        author: session ? `${session.prenom} ${session.nom}` : 'Système'
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
