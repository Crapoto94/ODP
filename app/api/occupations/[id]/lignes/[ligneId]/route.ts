import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ligneId: string }> }
) {
  try {
    const { ligneId } = await params;
    const id = parseInt(ligneId);
    const body = await request.json();
    const { quantite1, quantite2, dateDebut, dateFin, montant } = body;

    const ligne = await (prisma as any).ligneOccupation.update({
      where: { id },
      data: {
        quantite1: quantite1 !== undefined ? parseFloat(quantite1) : undefined,
        quantite2: quantite2 !== undefined ? parseFloat(quantite2) : undefined,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined,
        montant: montant !== undefined ? parseFloat(montant) : undefined
      }
    });

    // Recalculate total
    const occupationId = ligne.occupationId;
    const allLignes = await (prisma as any).ligneOccupation.findMany({
      where: { occupationId }
    });
    const total = allLignes.reduce((sum: number, l: any) => sum + (l.montant || 0), 0);
    await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: { montantCalcule: total }
    });

    return NextResponse.json(ligne);
  } catch (error) {
    console.error('Error updating line:', error);
    return NextResponse.json({ error: 'Failed to update line' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ligneId: string }> }
) {
  try {
    const { ligneId } = await params;
    const id = parseInt(ligneId);
    
    // Get occupationId before delete
    const ligneToDelete = await (prisma as any).ligneOccupation.findUnique({ where: { id } });
    const occupationId = ligneToDelete?.occupationId;

    await (prisma as any).ligneOccupation.delete({ where: { id } });

    if (occupationId) {
      const allLignes = await (prisma as any).ligneOccupation.findMany({
        where: { occupationId }
      });
      const total = allLignes.reduce((sum: number, l: any) => sum + (l.montant || 0), 0);
      await (prisma as any).occupation.update({
        where: { id: occupationId },
        data: { montantCalcule: total }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting line:', error);
    return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 });
  }
}
