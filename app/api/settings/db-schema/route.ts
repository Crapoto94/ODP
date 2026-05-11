import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Logic for PostgreSQL
    // We assume the schema is 'ODP' as configured
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name as name 
      FROM information_schema.tables 
      WHERE table_schema IN ('ODP', 'ODP_DEV') 
      AND table_type = 'BASE TABLE';
    `);

    const schemaInfo = await Promise.all(tables.map(async (t) => {
      const columns: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name as name, data_type as type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${t.name}' 
        AND table_schema IN ('ODP', 'ODP_DEV');
      `);
      return {
        name: t.name,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          pk: false // Heuristic
        }))
      };
    }));
    return NextResponse.json(schemaInfo);
  } catch (error: any) {
    console.error(`Error fetching db schema:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
