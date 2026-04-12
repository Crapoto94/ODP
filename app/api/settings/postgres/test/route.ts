import { NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/postgresClient';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let pgClient;
  
  // 1. Initialize Postgres Client
  try {
    pgClient = await getPostgresClient();
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  // 2. Query tables using config schema
  try {
    const config = await prisma.postgresConfig.findFirst();
    const targetSchema = config?.schema || 'public';

    const result = await pgClient.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema=$1;`,
      targetSchema
    );
    
    return NextResponse.json({ 
      success: true, 
      tables: result.map(t => t.table_name || t.TABLE_NAME) 
    });
  } catch (error: any) {
    console.error('[GET /api/settings/postgres/test] Error testing connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'La connexion à la base a échoué. Vérifiez vos identifiants.' 
    }, { status: 500 });
  }
}
