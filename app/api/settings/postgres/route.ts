import { NextResponse } from 'next/server';
import { initializePrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ host: '', port: 5432, database: '', user: '', password: '', schema: 'public', schemaDev: 'ODP' });
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return NextResponse.json(config.postgres || { host: '', port: 5432, database: '', user: '', password: '', schema: 'public', schemaDev: 'ODP' });
  } catch (error) {
    console.error('[GET /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Postgres credentials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { host, port, database, schema, schemaDev, user, password } = body;

    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    let config: any = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    config.postgres = { 
      ...config.postgres,
      host, 
      port: parseInt(port), 
      database, 
      schema, 
      schemaDev, 
      user, 
      password 
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Force re-initialization of the Postgres client
    await initializePrisma(true);

    return NextResponse.json(config.postgres);
  } catch (error) {
    console.error('[POST /api/settings/postgres] Error:', error);
    return NextResponse.json({ error: 'Failed to save Postgres credentials' }, { status: 500 });
  }
}
