import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  try {
    const items = await prisma.backlogItem.findMany({
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
  } catch (error: any) {
    console.error('[GET /api/backlog]', error);
    const message = error?.message || 'Failed to fetch backlog';
    return NextResponse.json({ error: message, items: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let requestedBy = 'Anonymous';
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;
      if (sessionToken) {
        const session = await decrypt(sessionToken);
        if (session && session.prenom && session.nom) {
          requestedBy = `${session.prenom} ${session.nom}`;
        }
      }
    } catch (e) {
      console.error('[POST /api/backlog] Error decrypting session:', e);
    }

    const item = await prisma.backlogItem.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type || 'FEATURE',
        priority: body.priority || 'MEDIUM',
        status: 'OPEN',
        requestedBy
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('[POST /api/backlog]', error);
    return NextResponse.json({ error: 'Failed to create backlog item' }, { status: 500 });
  }
}
