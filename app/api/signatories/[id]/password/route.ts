import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * PATCH /api/signatories/[id]/password
 * Set the P12 certificate password for a signatory
 * Body: { password: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { password } = await req.json();

    await prisma.signatory.update({
      where: { id },
      data: { signatureCertificatePassword: password || null }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/signatories/[id]/password]', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
