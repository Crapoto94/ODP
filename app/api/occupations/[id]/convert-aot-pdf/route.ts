import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicDocxToPdf } from '@/lib/aot/docx-to-pdf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  try {
    const occ = await prisma.occupation.findUnique({ where: { id } });
    if (!occ) {
      return NextResponse.json({ error: 'Occupation introuvable' }, { status: 404 });
    }

    const aotPath = occ.aotFinalPath;
    if (!aotPath) {
      return NextResponse.json({ error: 'Aucun document AOT' }, { status: 400 });
    }

    if (!aotPath.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ url: aotPath, alreadyPdf: true });
    }

    const pdfRelUrl = publicDocxToPdf(aotPath);

    await prisma.occupation.update({
      where: { id },
      data: { aotFinalPath: pdfRelUrl },
    });

    return NextResponse.json({ url: pdfRelUrl });
  } catch (err: any) {
    console.error('[convert-aot-pdf]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
