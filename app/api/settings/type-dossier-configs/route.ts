import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeTypeDossierConfigs } from '@/lib/init-type-configs';

export async function GET() {
  try {
    // Ensure configs are initialized
    await initializeTypeDossierConfigs();
    
    // Fetch configs
    const configs = await (prisma as any).typeDossierConfig.findMany({
      orderBy: { type: 'asc' }
    });
    
    return NextResponse.json(configs);
  } catch (error: any) {
    console.error('[API/TypeDossierConfigs] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { configs } = body;
    
    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: "Invalid data format. Expected 'configs' array." }, { status: 400 });
    }

    const results = [];
    for (const configData of configs) {
      const { type, id, updated_at, ...data } = configData;
      if (type) {
        const result = await (prisma as any).typeDossierConfig.upsert({
          where: { type },
          update: data,
          create: { type, ...data }
        });
        results.push(result);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[API/TypeDossierConfigs] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
