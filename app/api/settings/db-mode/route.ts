import { NextResponse } from 'next/server';
import { prismaLocal, initializePrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prismaLocal.appSettings.findFirst();
    return NextResponse.json({ mode: settings?.dbMode || 'PROD' });
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

    await prismaLocal.appSettings.update({
      where: { id: 1 },
      data: { dbMode: mode }
    });

    // Force re-initialization of the Postgres client with the new mode/schema
    await initializePrisma(true);

    return NextResponse.json({ success: true, mode });
  } catch (error: any) {
    console.error('[DB MODE UPDATE ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
