import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[DEBUG] Testing Prisma connection...');

    // Test 1: Try to fetch one occupation
    const testOcc = await (prisma as any).occupation.findFirst({
      take: 1,
      select: {
        id: true,
        nom: true,
        aotFinalPath: true
      }
    });

    console.log('[DEBUG] First occupation:', testOcc);

    // Test 2: Try to count occupations
    const count = await (prisma as any).occupation.count();
    console.log('[DEBUG] Total occupations:', count);

    // Test 3: Get raw query result
    const raw = await (prisma as any).$queryRaw`SELECT COUNT(*) as count FROM "Occupation"`;
    console.log('[DEBUG] Raw count:', raw);

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection working',
      testOccupation: testOcc,
      occupationCount: count,
      rawCount: raw
    });
  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    console.error('[DEBUG] Error message:', error.message);
    console.error('[DEBUG] Error code:', error.code);

    return NextResponse.json({
      status: 'error',
      error: error.message,
      code: error.code,
      details: error.toString()
    }, { status: 500 });
  }
}
