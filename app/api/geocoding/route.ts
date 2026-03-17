import { NextResponse } from 'next/server';
import { searchAddress } from '@/lib/geocoding';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json([]);
  }

  const results = await searchAddress(q);
  return NextResponse.json(results);
}
