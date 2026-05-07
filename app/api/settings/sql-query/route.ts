import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const client = prisma;

    // Determine if it's a SELECT or other
    const upperQuery = query.trim().toUpperCase();
    const isSelect = upperQuery.startsWith('SELECT') || 
                     upperQuery.startsWith('PRAGMA') || 
                     upperQuery.startsWith('SHOW') || 
                     upperQuery.startsWith('DESCRIBE') ||
                     upperQuery.startsWith('EXPLAIN');

    let result;
    if (isSelect) {
      result = await client.$queryRawUnsafe(query);
    } else {
      result = await client.$executeRawUnsafe(query);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error(`Error executing SQL on ${request.json.name}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
