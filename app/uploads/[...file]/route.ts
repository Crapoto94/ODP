import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  req: Request,
  props: { params: Promise<{ file: string[] }> }
) {
  const { file } = await props.params;
  const filePath = join(process.cwd(), 'public', 'uploads', ...file);

  if (!existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    
    // Determine the Content-Type based on the file extension
    const ext = filePath.split('.').pop() || '';
    let contentType = 'application/octet-stream';
    
    if (ext === 'pdf') {
        contentType = 'application/pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase())) {
        contentType = `image/${ext.toLowerCase() === 'jpg' ? 'jpeg' : ext.toLowerCase()}`;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Uploads Route Error]', error);
    return new NextResponse('Error reading file', { status: 500 });
  }
}
