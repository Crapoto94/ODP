import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendApmMail } from '@/lib/apm';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMINISTRATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const settings = await (prisma as any).appSettings.findFirst();
    if (!settings || !settings.adminEmail) {
      return NextResponse.json({ error: 'Email de l\'administrateur ODP non configuré' }, { status: 400 });
    }

    await sendApmMail(
      settings.adminEmail,
      '[ODP] Test d\'envoi à l\'administrateur',
      'Ceci est un message de test envoyé depuis la console ODP pour vérifier l\'adresse de l\'administrateur (paramètres \u2192 général).',
      'ODP Console'
    );

    return NextResponse.json({ success: true, target: settings.adminEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}