import { NextResponse } from 'next/server';
import { fetchBusinessesByCity } from '@/lib/insee';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codeCommune = searchParams.get('codeCommune') || '94041';
    const page = Number(searchParams.get('page')) || 1;

    const businesses = await fetchBusinessesByCity(codeCommune, page);
    return NextResponse.json(businesses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
