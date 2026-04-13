import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * POST /api/signatories - Create a new signatory
 * Request body: { nom, email, role, titre?, isDefault }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { nom, email, role, titre, isDefault } = await req.json();

    // Validate required fields
    if (!nom || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: nom, email, role' },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing defaults
    if (isDefault) {
      await prisma.signatory.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const signatory = await prisma.signatory.create({
      data: {
        nom,
        email: email.toLowerCase(),
        role,
        titre: titre || null,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json(signatory, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/signatories]', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A signatory with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create signatory' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/signatories - List all active signatories
 * Returns array of signatories sorted by isDefault first
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const signatories = await prisma.signatory.findMany({
      where: { statut: 'ACTIF' },
      orderBy: [
        { isDefault: 'desc' },
        { nom: 'asc' }
      ],
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        titre: true,
        isDefault: true,
        statut: true,
        created_at: true
      }
    });

    return NextResponse.json(signatories);
  } catch (error: any) {
    console.error('[GET /api/signatories]', error);
    return NextResponse.json(
      { error: 'Failed to fetch signatories' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/signatories - Update signatory settings
 * Can be used to toggle default status
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, isDefault } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing signatory id' },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing defaults
    if (isDefault) {
      await prisma.signatory.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.signatory.update({
      where: { id },
      data: { isDefault }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[PATCH /api/signatories]', error);
    return NextResponse.json(
      { error: 'Failed to update signatory' },
      { status: 500 }
    );
  }
}
