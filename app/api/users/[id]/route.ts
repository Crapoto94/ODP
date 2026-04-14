import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await req.json();
    const isAd = !!data.isAd;
    const isAdInt = isAd ? 1 : 0;
    const { id } = await params;
    const userId = parseInt(id);

    // Mot de passe : ignoré pour les comptes AD, optionnel pour les comptes locaux
    if (!isAd && data.password && data.password.trim() !== '') {
      const hashed = await bcrypt.hash(data.password, 10);
      await (prisma as any).$executeRaw`
        UPDATE "User" SET nom=${data.nom}, prenom=${data.prenom}, email=${data.email || ''},
          login=${data.login}, role=${data.role}, isAd=${isAdInt}, password=${hashed},
          updated_at=CURRENT_TIMESTAMP WHERE id=${userId}
      `;
    } else {
      await (prisma as any).$executeRaw`
        UPDATE "User" SET nom=${data.nom}, prenom=${data.prenom}, email=${data.email || ''},
          login=${data.login}, role=${data.role}, isAd=${isAdInt},
          updated_at=CURRENT_TIMESTAMP WHERE id=${userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting oneself
    if (session.id === parseInt(id)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    await (prisma as any).user.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
