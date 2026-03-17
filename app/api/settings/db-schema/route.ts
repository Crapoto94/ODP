import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // For SQLite, list all tables
    const tables: any[] = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
    );

    const schemaInfo = await Promise.all(tables.map(async (t) => {
      const columns: any[] = await prisma.$queryRawUnsafe(`PRAGMA table_info(${t.name});`);
      return {
        name: t.name,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          pk: c.pk === 1
        }))
      };
    }));

    return NextResponse.json(schemaInfo);
  } catch (error: any) {
    console.error('Error fetching db schema:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
