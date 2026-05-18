import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const occupationId = parseInt(id);

    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        tiers: {
          select: {
            id: true,
            nom: true,
            code_sedit: true,
            etatAdministratif: true,
            latitude: true,
            longitude: true
          }
        },
        lignes: {
          include: {
            article: true
          }
        },
        notes: true,
        contacts: true,
        dispositifs: true,
        signatureRequests: true
      }
    });

    if (!occupation) {
      return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
    }

    return NextResponse.json(occupation);
  } catch (error: any) {
    console.error('[GET Occupation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const occupationId = parseInt(id);
    const body = await request.json();

    // Check if occupation is archived
    const existingOccupation = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      select: { isArchived: true }
    });

    if (existingOccupation?.isArchived) {
      return NextResponse.json({ error: 'Ce dossier est archivé et ne peut pas être modifié' }, { status: 403 });
    }

    const {
      nom,
      tiersId,
      type,
      dateDebut,
      dateFin,
      dateAlerte,
      anneeTaxation,
      adresse,
      latitude,
      longitude,
      description,
      photos,
      isCourtMetrage,
      isExempt,
      isNotAuthorized,
      isAgissantPourBillable,
      agissantPour
    } = body;

    const updateData: any = {
      ...(nom !== undefined && { nom }),
      ...(tiersId !== undefined && { tiersId: parseInt(tiersId) }),
      ...(type !== undefined && { type }),
      ...(adresse !== undefined && { adresse }),
      ...(description !== undefined && { description }),
      ...(photos !== undefined && { photos }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(anneeTaxation !== undefined && { anneeTaxation: anneeTaxation ? parseInt(anneeTaxation) : null }),
      ...(dateDebut !== undefined && { dateDebut: dateDebut ? new Date(dateDebut) : null }),
      ...(dateFin !== undefined && { dateFin: dateFin ? new Date(dateFin) : null }),
      ...(dateAlerte !== undefined && { dateAlerte: dateAlerte ? new Date(dateAlerte) : null }),
      ...(agissantPour !== undefined && { agissantPour }),
      ...(isAgissantPourBillable !== undefined && { isAgissantPourBillable: !!isAgissantPourBillable })
    };

    const occupation = await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: updateData
    });

    if (isCourtMetrage !== undefined || isExempt !== undefined || isNotAuthorized !== undefined) {
      if (isCourtMetrage !== undefined) {
        await (prisma as any).$executeRaw`UPDATE "Occupation" SET "isCourtMetrage" = ${!!isCourtMetrage} WHERE id = ${occupationId}`;
      }
      if (isExempt !== undefined) {
        await (prisma as any).$executeRaw`UPDATE "Occupation" SET "isExempt" = ${!!isExempt} WHERE id = ${occupationId}`;
      }
      if (isNotAuthorized !== undefined) {
        await (prisma as any).$executeRaw`UPDATE "Occupation" SET "isNotAuthorized" = ${!!isNotAuthorized} WHERE id = ${occupationId}`;
      }

      // Refetch to get updated boolean flags
      const updated = await (prisma as any).occupation.findUnique({
        where: { id: occupationId }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(occupation);
  } catch (error: any) {
    console.error('[PATCH Occupation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const occupationId = parseInt(id);

    await (prisma as any).occupation.delete({
      where: { id: occupationId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE Occupation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
