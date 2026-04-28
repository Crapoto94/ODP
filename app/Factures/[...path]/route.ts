import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = join(process.cwd(), 'public', 'Factures', filePath);

    if (!existsSync(fullPath)) {
      return new NextResponse('Fichier non trouvé', { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error('[FILE SERVE ERROR]', error);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
}
