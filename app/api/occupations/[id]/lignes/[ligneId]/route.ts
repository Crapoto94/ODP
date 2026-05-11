import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOccupationTotal, calculateQ2 } from '@/lib/tlpe-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ligneId: string }> }
) {
  try {
    const { id: rawId, ligneId: rawLigneId } = await params;
    const occupationId = parseInt(rawId);
    const ligneId = parseInt(rawLigneId);
    const body = await request.json();
    const { articleId, quantite1, quantite2, dateDebut, dateFin, dateDebutConstatee, dateFinConstatee, montant, photos } = body;

    const existingLigne = await (prisma as any).ligneOccupation.findUnique({
      where: { id: ligneId },
      include: { 
        article: { include: { modeTaxation: true } },
        occupation: true
      }
    });

    if (!existingLigne) {
      return NextResponse.json({ error: 'Ligne non trouvée' }, { status: 404 });
    }

    const article = await (prisma as any).article.findUnique({
      where: { id: articleId ? parseInt(articleId) : existingLigne.articleId },
      include: { modeTaxation: true }
    });

    const mode = article?.modeTaxation?.nom || '';
    const parts = mode.split('/').map((p: string) => p.trim()).filter(Boolean);
    const temporalUnits = ['mois', 'jour', 'an', '10 jour'];
    let u2Label = parts[1] || '';
    if (parts.length >= 3) {
      u2Label = parts.find((p: string) => temporalUnits.some(tu => p.toLowerCase().includes(tu))) || parts[1];
    }

    const finalQuantite1 = quantite1 !== undefined ? parseFloat(quantite1) : existingLigne.quantite1;
    let finalQuantite2 = quantite2 !== undefined ? parseFloat(quantite2) : existingLigne.quantite2;

    const u2 = u2Label?.toLowerCase() || '';
    const isAutoUnit = u2.includes('jour') || u2.includes('nuit') || u2.includes('mois');
    const datesChanged = (dateDebut !== undefined || dateFin !== undefined || dateDebutConstatee !== undefined || dateFinConstatee !== undefined);

    if (isAutoUnit || (quantite2 === undefined && datesChanged)) {
       const fd = dateDebut !== undefined ? (dateDebut ? new Date(dateDebut) : null) : existingLigne.dateDebut;
       const ff = dateFin !== undefined ? (dateFin ? new Date(dateFin) : null) : existingLigne.dateFin;
       const fdc = dateDebutConstatee !== undefined ? (dateDebutConstatee ? new Date(dateDebutConstatee) : null) : existingLigne.dateDebutConstatee;
       const ffc = dateFinConstatee !== undefined ? (dateFinConstatee ? new Date(dateFinConstatee) : null) : existingLigne.dateFinConstatee;
       finalQuantite2 = calculateQ2(u2Label, fd, ff, fdc, ffc);
    }

    const baseMontant = article?.montant || 0;
    const finalMontantValue = (existingLigne.occupation.type === 'TLPE' && montant !== undefined) 
      ? parseFloat(montant) 
      : (baseMontant * finalQuantite1 * finalQuantite2);

    const ligne = await (prisma as any).ligneOccupation.update({
      where: { id: ligneId },
      data: {
        articleId: articleId ? parseInt(articleId) : undefined,
        quantite1: finalQuantite1,
        quantite2: finalQuantite2,
        montant: finalMontantValue,
        dateDebut: dateDebut !== undefined ? (dateDebut ? new Date(dateDebut) : null) : undefined,
        dateFin: dateFin !== undefined ? (dateFin ? new Date(dateFin) : null) : undefined,
        dateDebutConstatee: dateDebutConstatee !== undefined ? (dateDebutConstatee ? new Date(dateDebutConstatee) : null) : undefined,
        dateFinConstatee: dateFinConstatee !== undefined ? (dateFinConstatee ? new Date(dateFinConstatee) : null) : undefined,
        photos: photos !== undefined ? photos : undefined,
        note: body.note !== undefined ? body.note : undefined
      }
    });

    await updateOccupationTotal(occupationId);
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
    const { id: rawId, ligneId: rawLigneId } = await params;
    const occupationId = parseInt(rawId);
    const id = parseInt(rawLigneId);

    const ligneToDelete = await (prisma as any).ligneOccupation.findUnique({
      where: { id },
      include: { occupation: true }
    });
    const occId = ligneToDelete?.occupationId || occupationId;

    // Soft delete: mark with deletedAt instead of hard delete
    await (prisma as any).ligneOccupation.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    if (occId) {
       await updateOccupationTotal(occId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting line:', error);
    return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 });
  }
}
