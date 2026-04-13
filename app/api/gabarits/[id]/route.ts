import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const gabarit = await (prisma as any).gabarit.findUnique({
      where: { id }
    });
    if (!gabarit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(gabarit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await req.json();
    const { nom, contenu, isDefault } = body;

    // Get current gabarit to check its type
    const currentGabarit = await (prisma as any).gabarit.findUnique({
      where: { id }
    });

    if (!currentGabarit) {
      return NextResponse.json({ error: 'Gabarit not found' }, { status: 404 });
    }

    if (isDefault) {
       await (prisma as any).gabarit.updateMany({
         where: { isDefault: true, id: { not: id } },
         data: { isDefault: false }
       });
    }

    // Only update contenu for PDF gabarits, not DOCX
    const updateData: any = {
      isDefault
    };

    if (nom) updateData.nom = nom;

    // Only set contenu for PDF gabarits
    if (contenu && currentGabarit.type === 'PDF') {
      updateData.contenu = typeof contenu === 'string' ? contenu : JSON.stringify(contenu);
    }

    const gabarit = await (prisma as any).gabarit.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(gabarit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    // Get gabarit to check if it has a fichierPath
    const gabarit = await (prisma as any).gabarit.findUnique({
      where: { id }
    });

    if (!gabarit) {
      return NextResponse.json({ error: 'Gabarit not found' }, { status: 404 });
    }

    // Delete the file if it's a DOCX gabarit
    if (gabarit.fichierPath && gabarit.type === 'DOCX') {
      try {
        const filePath = join(process.cwd(), 'public', gabarit.fichierPath);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`[GABARIT DELETE] Deleted file: ${filePath}`);
        }
      } catch (err) {
        console.warn(`[GABARIT DELETE] Warning: Could not delete file ${gabarit.fichierPath}:`, err);
        // Don't fail the deletion if file cleanup fails
      }
    }

    await (prisma as any).gabarit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
