import { NextResponse } from 'next/server';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const tiersId = parseInt(rawId);
    
    const { searchParams } = new URL(req.url);
    const anneeStr = searchParams.get('annee');
    
    if (!anneeStr) {
      return NextResponse.json({ error: 'Année manquante' }, { status: 400 });
    }
    
    const annee = parseInt(anneeStr);

    const { buffer, filename } = await generateInvoicePdfBuffer(null, { tiersId, annee });

    // Sauvegarde physique de la facture
    const fs = await import('fs/promises');
    const path = await import('path');
    const timestamp = new Date().getTime();
    const saveName = `Facture-${tiersId}-${annee}-${timestamp}.pdf`;
    const saveDir = path.join(process.cwd(), 'public', 'Factures', 'Individuel');
    
    // S'assurer que le dossier existe
    await fs.mkdir(saveDir, { recursive: true });
    const savePath = path.join(saveDir, saveName);
    await fs.writeFile(savePath, Buffer.from(buffer));

    const publicPath = `/Factures/Individuel/${saveName}`;

    // Trouver l'occupation correspondante pour MAJ éventuelle
    const occupation = await (prisma as any).occupation.findFirst({
      where: { tiersId: tiersId, anneeTaxation: annee, type: 'COMMERCE' }
    });

    if (occupation && !occupation.facturePath) {
      await (prisma as any).occupation.update({
        where: { id: occupation.id },
        data: { facturePath: publicPath }
      });
    }

    // Ajouter une note dans le fil de discussion
    await (prisma as any).note.create({
      data: {
        tiersId: tiersId,
        content: `Génération d'un détail de facture (${annee})`,
        pjPath: publicPath,
        pjName: filename,
        isEmail: false,
        created_at: new Date()
      }
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[PDF COMMERCE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
