import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';
    try {
      console.log('[OCR] Launching Tesseract.recognize (V5)...');
      // Using the static recognize method which is more standard
      const { data } = await createWorker('fra').then(async (worker) => {
          const res = await worker.recognize(buffer);
          await worker.terminate();
          return res;
      });
      text = data.text;
      console.log('[OCR] Success. Length:', text.length);
    } catch (ocrError: any) {
      console.error('[OCR] Failure:', ocrError.message);
      return NextResponse.json({ error: "Échec du traitement OCR : " + ocrError.message }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: "Aucun texte extrait de l'image" }, { status: 400 });
    }

    console.log('[OCR] Extracted Text Length:', text.length);

    // Simple parser for extracting fields from text
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    
    let email = '';
    let telephone = '';
    let nom = '';
    let prenom = '';
    let title = '';

    // Regex for basic extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/;

    lines.forEach(line => {
      if (!email && emailRegex.test(line)) {
        email = line.match(emailRegex)?.[0] || '';
      }
      if (!telephone && phoneRegex.test(line)) {
        telephone = line.match(phoneRegex)?.[0] || '';
      }
    });

    // Heuristic for name (often first or second line)
    if (lines.length > 0) {
      const firstLine = lines[0].split(' ');
      if (firstLine.length >= 2) {
        prenom = firstLine[0];
        nom = firstLine.slice(1).join(' ');
      } else {
        nom = lines[0];
      }
    }
    if (lines.length > 1 && !title) {
      title = lines[1];
    }

    return NextResponse.json({
      success: true,
      nom,
      prenom,
      email,
      telephone,
      titre: title,
      raw: text
    });

  } catch (error: any) {
    console.error('[OCR GLOBAL ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne OCR : ' + error.message }, { status: 500 });
  }
}
