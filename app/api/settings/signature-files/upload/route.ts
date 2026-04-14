import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

const SIGNATURE_ASSETS_DIR = path.join(process.cwd(), 'public', 'signature-assets');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure directory exists
if (!fs.existsSync(SIGNATURE_ASSETS_DIR)) {
  fs.mkdirSync(SIGNATURE_ASSETS_DIR, { recursive: true });
}

/**
 * POST /api/settings/signature-files/upload
 * Upload signature image (PNG/SVG) or P12 certificate for a specific signatory
 * Form data: file, type ('image' or 'certificate'), signatoryId
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const signatoryId = parseInt(formData.get('signatoryId') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['image', 'certificate'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "image" or "certificate"' }, { status: 400 });
    }

    if (!signatoryId || isNaN(signatoryId)) {
      return NextResponse.json({ error: 'Missing or invalid signatoryId' }, { status: 400 });
    }

    // Validate signatory exists
    const signatory = await prisma.signatory.findUnique({ where: { id: signatoryId } });
    if (!signatory) {
      return NextResponse.json({ error: 'Signatory not found' }, { status: 404 });
    }

    // Validate file type and size
    if (type === 'image') {
      const validMimes = ['image/png', 'image/svg+xml', 'image/svg'];
      if (!validMimes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid image type. Only PNG and SVG are allowed' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: `Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` }, { status: 400 });
      }
    } else if (type === 'certificate') {
      if (file.size > MAX_CERT_SIZE) {
        return NextResponse.json({ error: `Certificate size exceeds ${MAX_CERT_SIZE / 1024 / 1024}MB limit` }, { status: 400 });
      }
      if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
        return NextResponse.json({ error: 'Invalid certificate type. Only P12/PFX are allowed' }, { status: 400 });
      }
    }

    // Delete old file if exists
    const oldPath = type === 'image' ? signatory.signatureImagePath : signatory.signatureCertificatePath;
    if (oldPath) {
      const oldFullPath = path.join(process.cwd(), 'public', oldPath);
      if (fs.existsSync(oldFullPath)) {
        try { fs.unlinkSync(oldFullPath); } catch {}
      }
    }

    // Generate unique filename
    const ext = type === 'image' ? path.extname(file.name) || '.png' : '.p12';
    const filename = `${randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(SIGNATURE_ASSETS_DIR, filename);
    const relativePath = `/signature-assets/${filename}`;

    // Write file to disk
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));

    // Update signatory
    const updateData = type === 'image'
      ? { signatureImagePath: relativePath }
      : { signatureCertificatePath: relativePath };

    await prisma.signatory.update({ where: { id: signatoryId }, data: updateData });

    return NextResponse.json({ success: true, url: relativePath, path: relativePath, type });
  } catch (error: any) {
    console.error('[POST /api/settings/signature-files/upload]', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
