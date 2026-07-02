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
            longitude: true,
            contacts: true
          }
        },
        lignes: {
          where: { deletedAt: null },
          include: {
            article: {
              include: { modeTaxation: true }
            }
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
      select: { isArchived: true, type: true, tiersId: true }
    });

    if (existingOccupation?.isArchived) {
      return NextResponse.json({ error: 'Ce dossier est archivé et ne peut pas être modifié' }, { status: 403 });
    }

    const {
      nom,
      tiersId,
      type,
      statut,
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
      agissantPour,
      aotFinalPath,
      aotSigned,
      aotDate,
      aotGabaritId,
      observations,
      datePaiement,
      numeroFacture,
      facturePath,
      isArchived
    } = body;

    const updateData: any = {
      ...(nom !== undefined && { nom }),
      ...(tiersId !== undefined && { tiersId: parseInt(tiersId) }),
      ...(type !== undefined && { type }),
      ...(statut !== undefined && { statut }),
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
      ...(isAgissantPourBillable !== undefined && { isAgissantPourBillable: !!isAgissantPourBillable }),
      ...(isCourtMetrage !== undefined && { isCourtMetrage: !!isCourtMetrage }),
      ...(isExempt !== undefined && { isExempt: !!isExempt }),
      ...(isNotAuthorized !== undefined && { isNotAuthorized: !!isNotAuthorized }),
      ...(aotFinalPath !== undefined && { aotFinalPath }),
      ...(aotSigned !== undefined && { aotSigned: !!aotSigned }),
      ...(aotDate !== undefined && { aotDate: aotDate || null }),
      ...(aotGabaritId !== undefined && { aotGabaritId: aotGabaritId ? parseInt(aotGabaritId) : null }),
      ...(observations !== undefined && { observations }),
      ...(datePaiement !== undefined && { datePaiement: datePaiement ? new Date(datePaiement) : null }),
      ...(numeroFacture !== undefined && { numeroFacture }),
      ...(facturePath !== undefined && { facturePath }),
      ...(isArchived !== undefined && { isArchived: !!isArchived })
    };

    const occupation = await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: updateData
    });

    // Pour un COMMERCE, le libellé du dossier nomme le commerce (établissement).
    // Le nom du tiers (facturation) reste inchangé.
    const effectiveType = type ?? existingOccupation?.type;
    const effectiveTiersId = tiersId !== undefined ? parseInt(tiersId) : existingOccupation?.tiersId;
    if (effectiveType === 'COMMERCE' && typeof nom === 'string' && nom.trim() !== '' && effectiveTiersId) {
      await (prisma as any).tiers.update({
        where: { id: effectiveTiersId },
        data: { nomEtablissement: nom.trim() }
      });
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
