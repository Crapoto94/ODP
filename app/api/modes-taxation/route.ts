import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const modes = await prisma.modeTaxation.findMany({
      orderBy: { nom: 'asc' }
    });
    return NextResponse.json(modes);
  } catch (error) {
    console.error('Error fetching taxation modes:', error);
    return NextResponse.json({ error: 'Failed to fetch taxation modes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom } = body;

    const mode = await prisma.modeTaxation.create({
      data: { nom }
    });

    return NextResponse.json(mode);
  } catch (error) {
    console.error('Error creating taxation mode:', error);
    return NextResponse.json({ error: 'Failed to create taxation mode' }, { status: 500 });
  }
}
