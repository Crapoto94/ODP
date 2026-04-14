import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { searchAD } from '@/lib/ad';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const users = await searchAD(q);
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
