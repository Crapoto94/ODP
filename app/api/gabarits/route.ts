import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const gabarits = await (prisma as any).gabarit.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(gabarits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, contenu, isDefault } = body;

    if (!nom || !contenu) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (isDefault) {
       // Unset existing default
       await (prisma as any).gabarit.updateMany({
         where: { isDefault: true },
         data: { isDefault: false }
       });
    }

    const gabarit = await (prisma as any).gabarit.create({
      data: {
        nom,
        contenu: typeof contenu === 'string' ? contenu : JSON.stringify(contenu),
        isDefault: !!isDefault
      }
    });

    return NextResponse.json(gabarit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
