import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const annee = searchParams.get('annee');

    // 1. Fetch available years (configs)
    const configs = await (prisma as any).odpConfig.findMany({
      orderBy: { annee: 'desc' }
    });

    if (!annee) {
      return NextResponse.json({ configs });
    }

    const anneeInt = parseInt(annee);

    // 2. Fetch Config for specific year
    const config = await (prisma as any).odpConfig.findUnique({
      where: { annee: anneeInt }
    });

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

    // 1. Check if config exists
    const existing = await (prisma as any).odpConfig.findUnique({
      where: { annee: anneeInt }
    });

    const data = {
      annee: anneeInt,
      deliberationPath: deliberationPath || null,
      tarifsTournagesPath: tarifsTournagesPath || null,
      tarifsOdpPath: tarifsOdpPath || null,
    };

    if (existing) {
      await (prisma as any).odpConfig.update({
        where: { annee: anneeInt },
        data
      });
    } else {
      await (prisma as any).odpConfig.create({
        data
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ODP-DOCS-POST-ERROR]', error.message);
    if (error.stack) console.error(error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { annee, deleteDelib, deleteTournages, deleteOdp } = body;

    const anneeInt = parseInt(annee);
    if (!anneeInt) return NextResponse.json({ error: "L'année est requise" }, { status: 400 });

    const data: any = {};
    if (deleteDelib) data.deliberationPath = null;
    if (deleteTournages) data.tarifsTournagesPath = null;
    if (deleteOdp) data.tarifsOdpPath = null;

    if (Object.keys(data).length > 0) {
      await (prisma as any).odpConfig.update({
        where: { annee: anneeInt },
        data
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ODP Docs PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
