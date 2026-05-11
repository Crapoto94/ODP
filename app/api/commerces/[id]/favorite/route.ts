import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tiersIdStr } = await params;
    const tiersId = parseInt(tiersIdStr, 10);
    if (isNaN(tiersId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

    // Check if already favorited
    const existing = await (prisma as any).favoriteCommerce.findUnique({
      where: {
        userId_tiersId: {
          userId: session.id,
          tiersId
        }
      }
    });

    if (existing) {
      // Remove from favorites
      await (prisma as any).favoriteCommerce.delete({
        where: {
          userId_tiersId: {
            userId: session.id,
            tiersId
          }
        }
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      // Add to favorites
      await (prisma as any).favoriteCommerce.create({
        data: {
          userId: session.id,
          tiersId
        }
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (err: any) {
    console.error('[favorite]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tiersIdStr } = await params;
    const tiersId = parseInt(tiersIdStr, 10);
    if (isNaN(tiersId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

    const favorite = await (prisma as any).favoriteCommerce.findUnique({
      where: {
        userId_tiersId: {
          userId: session.id,
          tiersId
        }
      }
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (err: any) {
    console.error('[favorite-get]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
