import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const occupationId = parseInt(id);

    // Update the occupation's isArchived flag
    await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: { isArchived: false }
    });

    return NextResponse.json({ success: true, message: 'Dossier restauré avec succès' });
  } catch (error: any) {
    console.error('[PATCH Unarchive] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
