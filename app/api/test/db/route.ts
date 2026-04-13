import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {} as any
  };

  try {
    // Test 1: Simple tiers count
    console.log('[DB Test] Test 1: Counting tiers...');
    const tiersCount = await prisma.tiers.count();
    results.checks.tiersCount = { status: 'ok', value: tiersCount };
    console.log('[DB Test] ✓ Tiers count:', tiersCount);
  } catch (e: any) {
    results.checks.tiersCount = { status: 'error', error: e.message };
    console.error('[DB Test] ✗ Tiers count failed:', e.message);
  }

  try {
    // Test 2: Simple occupation count
    console.log('[DB Test] Test 2: Counting occupations...');
    const occCount = await (prisma as any).occupation.count();
    results.checks.occupationCount = { status: 'ok', value: occCount };
    console.log('[DB Test] ✓ Occupation count:', occCount);
  } catch (e: any) {
    results.checks.occupationCount = { status: 'error', error: e.message };
    console.error('[DB Test] ✗ Occupation count failed:', e.message);
  }

  try {
    // Test 3: Get first occupation (simple fields only)
    console.log('[DB Test] Test 3: Fetching first occupation...');
    const occ = await (prisma as any).occupation.findFirst({
      select: {
        id: true,
        nom: true,
        type: true,
        statut: true
      }
    });
    results.checks.firstOccupation = { status: 'ok', value: occ };
    console.log('[DB Test] ✓ First occupation:', occ);
  } catch (e: any) {
    results.checks.firstOccupation = { status: 'error', error: e.message };
    console.error('[DB Test] ✗ First occupation failed:', e.message);
  }

  try {
    // Test 4: Get first occupation with tiers include
    console.log('[DB Test] Test 4: Fetching first occupation with tiers...');
    const occWithTiers = await (prisma as any).occupation.findFirst({
      include: { tiers: true },
      take: 1
    });
    results.checks.occupationWithTiers = { status: 'ok', hasData: !!occWithTiers };
    console.log('[DB Test] ✓ Occupation with tiers:', !!occWithTiers);
  } catch (e: any) {
    results.checks.occupationWithTiers = { status: 'error', error: e.message };
    console.error('[DB Test] ✗ Occupation with tiers failed:', e.message);
  }

  const allOk = Object.values(results.checks).every((c: any) => c.status === 'ok');

  return NextResponse.json(
    results,
    { status: allOk ? 200 : 500 }
  );
}
