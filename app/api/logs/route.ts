import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, deviceInfo, userAgent } = body;

    console.log('[LOG] Incoming activity:', { userId, action, deviceInfo: typeof deviceInfo === 'object' ? 'object' : deviceInfo });

    const result = await (prisma as any).$executeRawUnsafe(
      `INSERT INTO MobileLog (userId, action, deviceInfo, userAgent, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      userId || null,
      action || 'ACCESS',
      typeof deviceInfo === 'object' ? JSON.stringify(deviceInfo) : (deviceInfo || null),
      userAgent || null,
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      new Date().toISOString()
    );

    console.log('[LOG] Insert result:', result);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logging error:', error);
    // Silent fail for logging to avoid breaking the app
    return NextResponse.json({ success: false, error: 'Failed to log' }, { status: 200 });
  }
}

export async function GET() {
  try {
    // raw SQL because of Prisma client lock
    const logs = await (prisma as any).$queryRawUnsafe(`
      SELECT 
        MobileLog.*, 
        User.prenom as userPrenom, 
        User.nom as userNom 
      FROM MobileLog 
      LEFT JOIN User ON MobileLog.userId = User.id 
      ORDER BY MobileLog.created_at DESC 
      LIMIT 100
    `);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
