import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size check (<10Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }


    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const path = join(uploadDir, filename);
    console.log('[UPLOAD] Saving to:', path, 'Size:', file.size);

    await writeFile(path, buffer);
    console.log('[UPLOAD] Success:', filename);

    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      name: file.name
    });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
