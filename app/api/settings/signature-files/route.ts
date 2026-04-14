import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DELETE /api/settings/signature-files
 * Delete a signature file (image or certificate) for a specific signatory
 * Query params: type ('image' or 'certificate'), signatoryId
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const signatoryId = parseInt(searchParams.get('signatoryId') || '');

    if (!type || !['image', 'certificate'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "image" or "certificate"' }, { status: 400 });
    }

    if (!signatoryId || isNaN(signatoryId)) {
      return NextResponse.json({ error: 'Missing or invalid signatoryId' }, { status: 400 });
    }

    const signatory = await prisma.signatory.findUnique({ where: { id: signatoryId } });
    if (!signatory) {
      return NextResponse.json({ error: 'Signatory not found' }, { status: 404 });
    }

    const filePath = type === 'image' ? signatory.signatureImagePath : signatory.signatureCertificatePath;
    if (!filePath) {
      return NextResponse.json({ error: `No ${type} file configured for this signatory` }, { status: 404 });
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (err) {
        console.error(`Failed to delete file: ${fullPath}`, err);
      }
    }

    // Update signatory
    const updateData = type === 'image'
      ? { signatureImagePath: null }
      : { signatureCertificatePath: null };

    await prisma.signatory.update({ where: { id: signatoryId }, data: updateData });

    return NextResponse.json({ success: true, message: `${type} file deleted successfully` });
  } catch (error: any) {
    console.error('[DELETE /api/settings/signature-files]', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
