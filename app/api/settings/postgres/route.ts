import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.postgresConfig.findFirst();
    return NextResponse.json(config || { host: '', port: 5432, database: '', user: '', password: '' });
  } catch (error) {
    console.error('[GET /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Postgres credentials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { host, port, database, schema, user, password } = body;

    let config = await prisma.postgresConfig.findFirst();

    if (config) {
      config = await prisma.postgresConfig.update({
        where: { id: config.id },
        data: { host, port, database, schema, user, password }
      });
    } else {
      config = await prisma.postgresConfig.create({
        data: { host, port, database, schema, user, password }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[POST /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to save Postgres credentials' }, { status: 500 });
  }
}
