import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await (prisma as any).backlogItem.findMany({
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
    return NextResponse.json({ error: 'Failed to fetch backlog' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await (prisma as any).backlogItem.create({
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
    console.error(error);
    return NextResponse.json({ error: 'Failed to create backlog item' }, { status: 500 });
  }
}
