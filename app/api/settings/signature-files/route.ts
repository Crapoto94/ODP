import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DELETE /api/settings/signature-files
 * Delete a signature file (image or certificate)
 * Query param: type ('image' or 'certificate')
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type || !['image', 'certificate'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "image" or "certificate"' },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.findFirst({
      where: { id: 1 }
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    const filePath = type === 'image'
      ? settings.signatureImagePath
      : settings.signatureCertificatePath;

    if (!filePath) {
      return NextResponse.json(
        { error: `No ${type} file configured` },
        { status: 404 }
      );
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Failed to delete file: ${fullPath}`, err);
      }
    }

    // Update settings
    const updateData = type === 'image'
      ? { signatureImagePath: null }
      : { signatureCertificatePath: null };

    const updated = await prisma.appSettings.update({
      where: { id: 1 },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `${type} file deleted successfully`
    });
  } catch (error: any) {
    console.error('[DELETE /api/settings/signature-files]', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
