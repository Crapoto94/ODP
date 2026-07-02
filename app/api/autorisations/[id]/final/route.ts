import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST: enregistre le fichier AOT (déjà téléversé via /api/upload) sur l'autorisation.
// Aucune conversion à la volée : le fichier est stocké tel quel.
// Body: { url: string, signed?: boolean, dateSignature?: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const autorisationId = parseInt(id);
    const body = await request.json();
    const { url, signed, dateSignature } = body;

    if (!url) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });

    // Le document AOT doit être un PDF (nécessaire à la fusion de facturation).
    if (!String(url).toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Le document AOT doit être un fichier PDF.' }, { status: 400 });
    }

    const isSigned = signed !== undefined ? !!signed : true;

    const updated = await (prisma as any).autorisation.update({
      where: { id: autorisationId },
      data: {
        finalPath: url,
        signed: isSigned,
        // Date de signature uniquement si le document est marqué signé.
        dateSignature: isSigned ? (dateSignature ? new Date(dateSignature) : new Date()) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[POST autorisation final]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
