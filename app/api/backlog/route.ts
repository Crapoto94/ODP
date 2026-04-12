import { NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/postgresClient';

export async function GET() {
  try {
    const pgPrisma = await getPostgresClient();
    const items = await pgPrisma.backlogItem.findMany({
      include: { 
        version: true,
        comments: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('[GET /api/backlog]', error);
    return NextResponse.json({ error: 'Failed to fetch backlog' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const pgPrisma = await getPostgresClient();
    const body = await req.json();
    const item = await pgPrisma.backlogItem.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type || 'FEATURE',
        priority: body.priority || 'MEDIUM',
        status: 'OPEN'
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('[POST /api/backlog]', error);
    return NextResponse.json({ error: 'Failed to create backlog item' }, { status: 500 });
  }
}
