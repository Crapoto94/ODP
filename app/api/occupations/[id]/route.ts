import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOccupationTotal } from '@/lib/tlpe-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const occupation: any = await (prisma as any).occupation.findUnique({
      where: { id },
      include: { 
        tiers: { include: { contacts: true } },
        lignes: { include: { article: { include: { modeTaxation: true, categorie: true } } } },
        contacts: true,
        dispositifs: true,
        notes: { orderBy: { created_at: 'desc' } }
      }
    });

    if (!occupation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2. Parse meta for articles
    if (occupation.lignes) {
      occupation.lignes = occupation.lignes.map((l: any) => {
        if (l.article) {
          let meta = {};
          try {
            if (l.article.notes) meta = JSON.parse(l.article.notes);
          } catch (e) {}
          l.article.meta = meta;
        }
        return l;
      });
    }

    // 3. History for COMMERCE and TLPE
    let history = [];
    if (occupation.type === 'COMMERCE' || occupation.type === 'TLPE') {
      history = await (prisma as any).occupation.findMany({
        where: {
          tiersId: occupation.tiersId,
          adresse: occupation.adresse,
          type: occupation.type,
          id: { not: id }
        },
        select: { id: true, anneeTaxation: true },
        orderBy: { anneeTaxation: 'desc' }
      });
    }

    return NextResponse.json({ ...occupation, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await req.json();
    const {
      nom,
      tiersId,
      type,
      statut,
      dateDebut,
      dateFin,
      anneeTaxation,
      adresse,
      latitude,
      longitude,
      description,
      photos,
      numeroFacture,
      facturePath,
      datePaiement,
      isCourtMetrage,
      agissantPour,
      aotGabaritId,
      aotFinalPath
    } = body;

    const updateData: any = {
      nom,
      tiersId: tiersId ? parseInt(tiersId) : undefined,
      type,
      statut,
      dateDebut: dateDebut !== undefined ? (dateDebut ? new Date(dateDebut) : null) : undefined,
      dateFin: dateFin !== undefined ? (dateFin ? new Date(dateFin) : null) : undefined,
      anneeTaxation: anneeTaxation !== undefined ? (anneeTaxation ? parseInt(anneeTaxation) : null) : undefined,
      adresse,
      latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
      longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
      description,
      photos,
      agissantPour: agissantPour !== undefined ? agissantPour : undefined,
      numeroFacture: numeroFacture !== undefined ? numeroFacture : undefined,
      facturePath: facturePath !== undefined ? facturePath : undefined,
      aotGabaritId: aotGabaritId !== undefined ? (aotGabaritId ? parseInt(aotGabaritId) : null) : undefined,
      aotFinalPath: aotFinalPath !== undefined ? aotFinalPath : undefined,
    };

    const occupation = await (prisma as any).occupation.update({
      where: { id },
      data: updateData
    });

    if (isCourtMetrage !== undefined) {
      await (prisma as any).$executeRaw`UPDATE Occupation SET isCourtMetrage = ${!!isCourtMetrage} WHERE id = ${id}`;
    }

    // Recalculer le montant net total (exonération globale, etc.)
    await updateOccupationTotal(id);

    return NextResponse.json(occupation);
  } catch (error: any) {
    console.error('Error updating occupation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    await (prisma as any).occupation.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
