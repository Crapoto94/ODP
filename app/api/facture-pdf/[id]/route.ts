import { NextResponse } from 'next/server';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    
    const { buffer, filename } = await generateInvoicePdfBuffer(id);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[PDF ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
