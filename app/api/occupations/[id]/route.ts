import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const occupation = await (prisma as any).occupation.findUnique({
      where: { id },
      include: { 
        tiers: true,
        lignes: { include: { article: true } }
      }
    });
    return NextResponse.json(occupation);
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
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      adresse,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
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
