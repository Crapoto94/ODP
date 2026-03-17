import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.appSettings.findFirst();
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 1,
          financeEmail: 'finances@mairie-65k.fr',
          appUrl: 'http://localhost:3000',
          apmUrl: 'http://localhost:8001/api/v1',
          apmToken: 'DSIHUB-ODP-KEY-2026',
          senderName: 'ODP Console',
          senderEmail: 'dsihub@fbc.fr'
        }
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { financeEmail, appUrl, apmUrl, apmToken, senderName, senderEmail } = body;

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { financeEmail, appUrl, apmUrl, apmToken, senderName, senderEmail },
      create: { 
        id: 1, 
        financeEmail: financeEmail || 'finances@mairie-65k.fr', 
        appUrl: appUrl || 'http://localhost:3000',
        apmUrl: apmUrl || 'http://localhost:8001/api/v1', 
        apmToken: apmToken || 'DSIHUB-ODP-KEY-2026',
        senderName: senderName || 'ODP Console',
        senderEmail: senderEmail || 'dsihub@fbc.fr'
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
