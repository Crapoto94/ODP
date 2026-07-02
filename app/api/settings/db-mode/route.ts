import { NextResponse } from 'next/server';
import { initializePrisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return NextResponse.json({ mode: config.postgres?.mode || 'PROD' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { mode } = await req.json();
    if (mode !== 'PROD' && mode !== 'DEV') {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
    }

    // Le mode DEV est réservé aux administrateurs ; les autres profils
    // ne peuvent rester qu'en mode PROD.
    if (mode === 'DEV') {
      const session = await getSession();
      if (!session || session.role !== 'ADMINISTRATEUR') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    if (!config.postgres) config.postgres = {};
    config.postgres.mode = mode;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Force re-initialization of the Postgres client with the new mode/schema
    await initializePrisma(true);

    return NextResponse.json({ success: true, mode });
  } catch (error: any) {
    console.error('[DB MODE UPDATE ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
