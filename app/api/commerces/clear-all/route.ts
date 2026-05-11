import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const occupations = await (prisma as any).occupation.findMany({
      where: { type: 'COMMERCE' },
      select: { id: true }
    });

    const occIds = occupations.map((o: any) => o.id);
    
    if (occIds.length > 0) {
      await (prisma as any).ligneOccupation.deleteMany({
        where: { occupationId: { in: occIds } }
      });

      await (prisma as any).occupation.deleteMany({
        where: { id: { in: occIds } }
      });
    }

    return NextResponse.json({ success: true, count: occIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
