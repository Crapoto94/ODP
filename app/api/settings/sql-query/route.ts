import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Determine if it's a SELECT or other
    const isSelect = query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA');

    let result;
    if (isSelect) {
      result = await prisma.$queryRawUnsafe(query);
    } else {
      result = await prisma.$executeRawUnsafe(query);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error executing SQL:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
