import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer as hasPermission } from '@/lib/permissions-server';

/**
 * PATCH /api/signatories/[id] - Update a signatory
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MANAGE_USERS')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { nom, email, role, titre, isDefault } = await req.json();

    // If setting as default, unset any existing defaults
    if (isDefault) {
      await prisma.signatory.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.signatory.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(email && { email: email.toLowerCase() }),
        ...(role && { role }),
        ...(titre !== undefined && { titre: titre || null }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[PATCH /api/signatories/[id]]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Signatory not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A signatory with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update signatory' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/signatories/[id] - Soft delete a signatory
 * Sets statut to INACTIF instead of hard delete to preserve audit trail
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const session = await getSession();
    if (!session || !hasPermission(session.role, 'MANAGE_USERS')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Soft delete by setting status to INACTIF
    const updated = await prisma.signatory.update({
      where: { id },
      data: { statut: 'INACTIF' }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[DELETE /api/signatories/[id]]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Signatory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete signatory' },
      { status: 500 }
    );
  }
}
