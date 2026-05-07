import { NextResponse } from 'next/server';
import { prismaLocal, initializePrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prismaLocal.postgresConfig.findFirst();
    return NextResponse.json(config || { host: '', port: 5432, database: '', user: '', password: '', schema: 'public', schemaDev: 'ODP' });
  } catch (error) {
    console.error('[GET /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Postgres credentials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { host, port, database, schema, schemaDev, user, password } = body;

    let config = await prismaLocal.postgresConfig.findFirst();

    if (config) {
      config = await prismaLocal.postgresConfig.update({
        where: { id: config.id },
        data: { host, port, database, schema, schemaDev, user, password }
      });
    } else {
      config = await prismaLocal.postgresConfig.create({
        data: { host, port, database, schema, schemaDev, user, password }
      });
    }

    // Force re-initialization of the Postgres client
    await initializePrisma(true);

    return NextResponse.json(config);
  } catch (error) {
    console.error('[POST /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to save Postgres credentials' }, { status: 500 });
  }
}
