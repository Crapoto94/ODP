import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, deviceInfo, userAgent } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    await prisma.mobileLog.create({
      data: {
        userId: userId || null,
        action: action || 'ACCESS',
        deviceInfo: typeof deviceInfo === 'object' ? JSON.stringify(deviceInfo) : (deviceInfo || null),
        userAgent: userAgent || null,
        ip: ip
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST LOG ERROR]', error);
    // Silent fail for logging to avoid breaking the client app
    return NextResponse.json({ success: false, error: 'Failed to log' }, { status: 200 });
  }
}

export async function GET() {
  try {
    const logs = await prisma.mobileLog.findMany({
      include: {
        user: {
          select: {
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100
    });

    // Flatten for frontend compatibility
    const flattened = logs.map(l => ({
      ...l,
      userNom: l.user?.nom,
      userPrenom: l.user?.prenom
    }));

    return NextResponse.json(flattened);
  } catch (error: any) {
    console.error('[GET LOGS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
