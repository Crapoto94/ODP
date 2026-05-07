import { NextRequest, NextResponse } from 'next/server';
import { prisma, prismaLocal } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dbType = searchParams.get('db') || 'main'; // 'main' (Postgres) or 'local' (SQLite)

  try {
    if (dbType === 'local') {
      // Logic for SQLite
      const tables: any[] = await prismaLocal.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
      );

      const schemaInfo = await Promise.all(tables.map(async (t) => {
        const columns: any[] = await prismaLocal.$queryRawUnsafe(`PRAGMA table_info("${t.name}");`);
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
    } else {
      // Logic for PostgreSQL
      // We assume the schema is 'ODP' as configured
      const tables: any[] = await prisma.$queryRawUnsafe(`
        SELECT table_name as name 
        FROM information_schema.tables 
        WHERE table_schema = 'ODP' 
        AND table_type = 'BASE TABLE';
      `);

      const schemaInfo = await Promise.all(tables.map(async (t) => {
        const columns: any[] = await prisma.$queryRawUnsafe(`
          SELECT column_name as name, data_type as type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${t.name}' 
          AND table_schema = 'ODP';
        `);
        return {
          name: t.name,
          columns: columns.map(c => ({
            name: c.name,
            type: c.type,
            pk: false // Heuristic or query constraints if needed
          }))
        };
      }));
      return NextResponse.json(schemaInfo);
    }
  } catch (error: any) {
    console.error(`Error fetching ${dbType} db schema:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
