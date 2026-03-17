import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calculateQ2(u2: string, start: Date | null, end: Date | null, startC: Date | null, endC: Date | null) {
  const s = startC || start;
  const e = endC || end;
  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;

  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // Inclusive

  const unit = (u2 || '').toLowerCase();
  if (unit.includes('an')) return 1;
  if (unit.includes('10 jour')) return Math.ceil(diffDays / 10);
  if (unit.includes('mois')) return Math.ceil(diffDays / 31);
  if (unit.includes('jour')) return diffDays;
  return 1;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ligneId: string }> }
) {
  try {
    const { ligneId } = await params;
    const id = parseInt(ligneId);
    const body = await request.json();
    const { articleId, quantite1, quantite2, dateDebut, dateFin, dateDebutConstatee, dateFinConstatee, montant, photos } = body;

    const existingLigne = await (prisma as any).ligneOccupation.findUnique({
      where: { id },
      include: { 
        article: { include: { modeTaxation: true } },
        occupation: true
      }
    });

    if (!existingLigne) {
      return NextResponse.json({ error: 'Ligne non trouvée' }, { status: 404 });
    }

    const newArticleId = articleId !== undefined ? parseInt(articleId) : existingLigne.articleId;
    const newQuantite1 = quantite1 !== undefined ? parseFloat(quantite1) : existingLigne.quantite1;
    
    // Dates calculation
    const finalDateDebut = dateDebut !== undefined ? (dateDebut ? new Date(dateDebut) : null) : existingLigne.dateDebut;
    const finalDateFin = dateFin !== undefined ? (dateFin ? new Date(dateFin) : null) : existingLigne.dateFin;
    const finalDateDebutC = dateDebutConstatee !== undefined ? (dateDebutConstatee ? new Date(dateDebutConstatee) : null) : existingLigne.dateDebutConstatee;
    const finalDateFinC = dateFinConstatee !== undefined ? (dateFinConstatee ? new Date(dateFinConstatee) : null) : existingLigne.dateFinConstatee;

    let finalQuantite2 = quantite2 !== undefined ? parseFloat(quantite2) : existingLigne.quantite2;
    let finalMontant = montant !== undefined ? parseFloat(montant) : existingLigne.montant;

    const occupationType = existingLigne.occupation.type;

    // Recalculate if anything changed that affects the total
    if (articleId !== undefined || quantite1 !== undefined || quantite2 !== undefined || 
        dateDebut !== undefined || dateFin !== undefined || 
        dateDebutConstatee !== undefined || dateFinConstatee !== undefined) {
      
      const article = articleId !== undefined 
        ? await (prisma as any).article.findUnique({ 
            where: { id: newArticleId },
            include: { modeTaxation: true }
          })
        : existingLigne.article;
      
      const mode = article?.modeTaxation?.nom || '';
      const parts = mode.split('/').map((p: string) => p.trim());
      const u2Label = parts[1] || '';

      if (occupationType === 'COMMERCE') {
        finalQuantite2 = 1;
      } else if (occupationType === 'CHANTIER') {
        finalQuantite2 = calculateQ2(u2Label, finalDateDebut, finalDateFin, finalDateDebutC, finalDateFinC);
      }

      const baseMontant = article?.montant || 0;
      finalMontant = baseMontant * newQuantite1 * finalQuantite2;
    }

    const ligne = await (prisma as any).ligneOccupation.update({
      where: { id },
      data: {
        articleId: articleId !== undefined ? newArticleId : undefined,
        quantite1: newQuantite1,
        quantite2: finalQuantite2,
        dateDebut: finalDateDebut,
        dateFin: finalDateFin,
        dateDebutConstatee: finalDateDebutC,
        dateFinConstatee: finalDateFinC,
        montant: finalMontant,
        photos: photos !== undefined ? photos : undefined
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
