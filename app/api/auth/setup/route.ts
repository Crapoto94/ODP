import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const userCount = await (prisma as any).user.count();

    if (userCount > 0) {
      return NextResponse.json({ error: 'Système déjà initialisé' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await (prisma as any).user.create({
      data: {
        nom: 'Administrateur',
        prenom: 'Système',
        email: 'admin@odp.fr',
        login: 'admin',
        password: hashedPassword,
        role: 'ADMIN' // AGENT_TERRAIN, AGENT_BUREAU, AGENT_COMPTABLE, ADMIN
      }
    });

    return NextResponse.json({ success: true, message: 'Administrateur créé avec succès (login: admin, mdp: admin123)' });

  } catch (error: any) {
    console.error('[SETUP ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne lors de la configuration' }, { status: 500 });
  }
}
