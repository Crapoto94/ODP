import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const annee = searchParams.get('annee');

    // 1. Fetch available years (configs)
    const configs = await prisma.$queryRaw`SELECT * FROM OdpConfig ORDER BY annee DESC` as any[];

    if (!annee) {
      return NextResponse.json({ configs });
    }

    const anneeInt = parseInt(annee);

    // 2. Fetch Config for specific year
    const configRecords = await prisma.$queryRaw`SELECT * FROM OdpConfig WHERE annee = ${anneeInt}` as any[];
    const config = configRecords[0] || null;

    return NextResponse.json({ 
      configs,
      config
    });

  } catch (error: any) {
    console.error('ODP Docs GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { annee, deliberationPath, tarifsTournagesPath, tarifsOdpPath } = body;

    const anneeInt = parseInt(annee);
    if (!anneeInt) return NextResponse.json({ error: "L'année est requise" }, { status: 400 });

    // Create/Update Config in SQLite using raw query to avoid issues with un-generated Prisma types
    await prisma.$executeRaw`
      INSERT INTO OdpConfig (annee, deliberationPath, tarifsTournagesPath, tarifsOdpPath)
      VALUES (${anneeInt}, ${deliberationPath}, ${tarifsTournagesPath}, ${tarifsOdpPath})
      ON CONFLICT(annee) DO UPDATE SET
        deliberationPath = EXCLUDED.deliberationPath,
        tarifsTournagesPath = EXCLUDED.tarifsTournagesPath,
        tarifsOdpPath = EXCLUDED.tarifsOdpPath
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ODP Docs POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
