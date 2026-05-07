import { NextResponse } from 'next/server';
import { getLocalConfig } from '@/lib/prisma';
import { PrismaClient } from '@/lib/prisma-client';

async function testConnection(config: any) {
  const { host, port, database, user, password, schema, schemaDev } = config;
  const isDev = process.env.NODE_ENV === 'development';
  const targetSchema = (isDev && schemaDev) ? schemaDev : (schema || 'public');
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;

  const tempClient = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    // Attempt a simple query
    const result = await tempClient.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' LIMIT 50;`,
      targetSchema
    );
    
    return { 
      success: true, 
      tables: result.map(t => t.table_name) 
    };
  } catch (error: any) {
    console.error('[POSTGRES TEST ERROR]', error.message);
    throw new Error(error.message);
  } finally {
    await tempClient.$disconnect();
  }
}

export async function GET() {
  try {
    const config = getLocalConfig();
    const pg = config?.postgres;
    if (!pg) {
      return NextResponse.json({ success: false, error: 'Aucune configuration trouvée' }, { status: 404 });
    }
    const result = await testConnection(pg);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const config = await req.json();
    const result = await testConnection(config);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
