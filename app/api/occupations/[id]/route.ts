import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const occupation: any = await (prisma as any).occupation.findUnique({
      where: { id },
      include: { 
        tiers: true,
        lignes: { include: { article: { include: { modeTaxation: true } } } },
        contacts: true
      }
    });

    if (!occupation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // History for COMMERCE
    let history = [];
    if (occupation.type === 'COMMERCE') {
      history = await (prisma as any).occupation.findMany({
        where: {
          tiersId: occupation.tiersId,
          adresse: occupation.adresse,
          type: 'COMMERCE',
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
      photos
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
      photos
    };

    const occupation = await (prisma as any).occupation.update({
      where: { id },
      data: updateData
    });

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
