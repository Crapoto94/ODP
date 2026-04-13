import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const nom = formData.get('nom') as string || 'Nouveau Gabarit DOCX';
    const isDefault = formData.get('isDefault') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Seuls les fichiers .docx sont acceptés' }, { status: 400 });
    }

    // Check if a gabarit with the same name already exists
    const existingGabarit = await (prisma as any).gabarit.findFirst({
      where: {
        nom: nom,
        type: 'DOCX'
      }
    });

    // If exists, delete the old file and database record
    if (existingGabarit) {
      try {
        const oldFilePath = join(process.cwd(), 'public', existingGabarit.fichierPath.replace(/^\//, ''));
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch (err) {
        console.warn('[UPLOAD DOCX] Could not delete old file:', err);
      }

      await (prisma as any).gabarit.delete({
        where: { id: existingGabarit.id }
      });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'gabarits-docx');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadDir, filename);
    const publicPath = `/gabarits-docx/${filename}`;

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Create gabarit in database
    const gabarit = await (prisma as any).gabarit.create({
      data: {
        nom,
        type: 'DOCX',
        fichierPath: publicPath,
        isDefault: isDefault && (await (prisma as any).gabarit.count({ where: { type: 'DOCX', isDefault: true } })) === 0,
      },
    });

    return NextResponse.json({
      success: true,
      gabarit: {
        id: gabarit.id,
        nom: gabarit.nom,
        type: gabarit.type,
        fichierPath: gabarit.fichierPath,
        isDefault: gabarit.isDefault,
      },
    });
  } catch (err: any) {
    console.error('[UPLOAD DOCX ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
