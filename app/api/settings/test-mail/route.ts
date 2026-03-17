import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';

export async function POST() {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings || !settings.financeEmail) {
      return NextResponse.json({ error: 'Email des finances non configuré' }, { status: 400 });
    }

    await sendApmMail(
      settings.financeEmail,
      '[ODP] Test d\'envoi de mail',
      'Ceci est un message de test envoyé depuis la console ODP pour vérifier la configuration du Proxy Manager.',
      'ODP Console'
    );

    return NextResponse.json({ success: true, target: settings.financeEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
