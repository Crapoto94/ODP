import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOccupationTotal } from '@/lib/tlpe-utils';
import { getSession } from '@/lib/auth';

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

    // 1.5 Fetch agissantPour tier if exists
    if (occupation.agissantPour) {
      const apId = parseInt(occupation.agissantPour);
      if (!isNaN(apId)) {
        occupation.agissantPourTier = await prisma.tiers.findUnique({ 
          where: { id: apId } 
        });
      }
    }

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
      isAgissantPourBillable,
      agissantPour,
      aotGabaritId,
      aotFinalPath,
      aotSigned,
      observations
    } = body;

    // Fetch old occupation to detect status change and AOT upload
    const oldOccupation = await (prisma as any).occupation.findUnique({ where: { id } });
    const statusChanged = statut && oldOccupation && oldOccupation.statut !== statut;
    const aotUploaded = aotFinalPath && oldOccupation && !oldOccupation.aotFinalPath && aotFinalPath !== oldOccupation.aotFinalPath;
    const aotNowSigned = aotSigned && oldOccupation && !oldOccupation.aotSigned;

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
      observations: observations !== undefined ? observations : undefined,
      agissantPour: agissantPour !== undefined ? agissantPour : undefined,
      isAgissantPourBillable: isAgissantPourBillable !== undefined ? !!isAgissantPourBillable : undefined,
      numeroFacture: numeroFacture !== undefined ? numeroFacture : undefined,
      facturePath: facturePath !== undefined ? facturePath : undefined,
      aotGabaritId: aotGabaritId !== undefined ? (aotGabaritId ? parseInt(aotGabaritId) : null) : undefined,
      aotFinalPath: aotFinalPath !== undefined ? aotFinalPath : undefined,
      aotSigned: aotSigned !== undefined ? !!aotSigned : undefined,
    };

    const occupation = await (prisma as any).occupation.update({
      where: { id },
      data: updateData
    });

    if (isCourtMetrage !== undefined) {
      await (prisma as any).$executeRaw`UPDATE Occupation SET isCourtMetrage = ${!!isCourtMetrage} WHERE id = ${id}`;
    }

    // Add automatic notes for changes
    const session = await getSession();
    const author = session ? `${session.prenom} ${session.nom}`.trim() : 'Conseiller';
    const now = new Date().toISOString();
    const year = oldOccupation.anneeTaxation || new Date().getFullYear();

    if (statusChanged) {
      const noteContent = `📊 Passage de statut : ${oldOccupation.statut} → ${statut} (${year})`;
      await (prisma as any).note.create({
        data: {
          occupationId: id,
          content: noteContent,
          author: author,
          isEmail: false,
          origin: 'desktop',
          created_at: new Date(now)
        }
      });
    }

    if (aotUploaded) {
      const noteContent = `📄 Document AOT uploadé${aotNowSigned ? ' et signé' : ' (en brouillon)'} (${year})`;
      await (prisma as any).note.create({
        data: {
          occupationId: id,
          content: noteContent,
          author: author,
          isEmail: false,
          origin: 'desktop',
          created_at: new Date(now)
        }
      });
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
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Seul un administrateur peut supprimer un dossier' }, { status: 403 });
    }

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
