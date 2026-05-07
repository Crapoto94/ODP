import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const messages = await prisma.contextualMessage.findMany();
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('[GET MESSAGES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { cle, valeur, label, sujet, disabled } = await req.json();
    if (!cle || valeur === undefined) {
      return NextResponse.json({ error: 'cle et valeur requis' }, { status: 400 });
    }

    const message = await prisma.contextualMessage.upsert({
      where: { cle },
      update: {
        valeur,
        label: label ?? null,
        sujet: sujet ?? null,
        disabled: !!disabled
      },
      create: {
        cle,
        valeur,
        label: label ?? null,
        sujet: sujet ?? null,
        disabled: !!disabled
      }
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('[PUT MESSAGES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { cle, label, disabled } = await req.json();
    if (!cle) return NextResponse.json({ error: 'cle requis' }, { status: 400 });

    const message = await prisma.contextualMessage.update({
      where: { cle },
      data: {
        label: label !== undefined ? (label ?? null) : undefined,
        disabled: disabled !== undefined ? !!disabled : undefined
      }
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('[PATCH MESSAGES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cle = req.nextUrl.searchParams.get('cle');
    if (!cle) return NextResponse.json({ error: 'cle requis' }, { status: 400 });

    await prisma.contextualMessage.delete({
      where: { cle }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE MESSAGES ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
