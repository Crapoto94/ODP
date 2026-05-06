import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await (prisma as any).favoriteCommerce.findMany({
      where: { userId: session.id },
      select: { tiersId: true }
    });

    return NextResponse.json(favorites.map((f: any) => f.tiersId));
  } catch (err: any) {
    console.error('[favorites-list]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
