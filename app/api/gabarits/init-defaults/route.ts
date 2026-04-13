import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Initialize default gabarits if they don't exist
 * This endpoint creates default DOCX and PDF gabarits from template files
 */
export async function POST(req: Request) {
  try {
    console.log('[GABARITS INIT] Starting default gabarits initialization...');

    // Check if a default DOCX gabarit already exists
    const existingDocxDefault = await (prisma as any).gabarit.findFirst({
      where: { type: 'DOCX', isDefault: true }
    });

    if (existingDocxDefault) {
      console.log('[GABARITS INIT] Default DOCX gabarit already exists');
      return NextResponse.json({
        message: 'Default gabarits already initialized',
        docxDefault: existingDocxDefault
      });
    }

    // Check if ANY DOCX gabarit exists
    const anyDocxGabarit = await (prisma as any).gabarit.findFirst({
      where: { type: 'DOCX' }
    });

    let createdGabarit = null;

    if (!anyDocxGabarit) {
      console.log('[GABARITS INIT] Creating default DOCX gabarit...');
      createdGabarit = await (prisma as any).gabarit.create({
        data: {
          nom: 'AOT - Template par défaut',
          type: 'DOCX',
          fichierPath: '/templates/AOT-Template-Default.docx',
          isDefault: true,
          contenu: null // DOCX gabarits don't have contenu
        }
      });
      console.log('[GABARITS INIT] Created default DOCX gabarit:', createdGabarit.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Default gabarits initialized',
      created: createdGabarit
    });
  } catch (err: any) {
    console.error('[GABARITS INIT ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Allow GET for easier testing
  return POST(req);
}
