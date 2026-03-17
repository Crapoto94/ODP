import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const notes = await (prisma as any).note.findMany({
      where: { occupationId: parseInt(id) },
      orderBy: { created_at: 'asc' }
    });
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const note = await (prisma as any).note.create({
      data: {
        occupationId: parseInt(id),
        content: body.content,
        author: body.author || 'Conseiller'
      }
    });
    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
