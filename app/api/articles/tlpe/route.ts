import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const annee = searchParams.get('annee');

    // 1. Fetch available years (configs)
    const configs = await prisma.$queryRaw`SELECT * FROM TlpeConfig ORDER BY annee DESC` as any[];

    if (!annee) {
      return NextResponse.json({ configs });
    }

    const anneeInt = parseInt(annee);

    // 2. Fetch Config for specific year
    const configRecords = await prisma.$queryRaw`SELECT * FROM TlpeConfig WHERE annee = ${anneeInt}` as any[];
    const config = configRecords[0] || null;

    // 3. Fetch Articles (Ref + Catalogue) for this specific year
    const articles = await prisma.$queryRaw`
      SELECT * FROM Article 
      WHERE categorieId = 30 
      AND (
        json_extract(notes, '$.annee') = ${anneeInt}
        OR json_extract(notes, '$.isCatalogue') IS NOT NULL
      )
    ` as any[];

    const parsedArticles = articles.map(a => {
      let meta = {};
      try {
        if (a.notes) meta = JSON.parse(a.notes);
      } catch (e) {}
      return { ...a, meta };
    });

    // 4. Extract Tariffs from Ref Articles
    const refArticles = parsedArticles.filter(a => a.meta.isRef);
    const tarifs = {
      enseignes_12_50: refArticles.find(a => a.meta.refSlot === 'enseignes_12_50')?.montant || 0,
      enseignes_50_plus: refArticles.find(a => a.meta.refSlot === 'enseignes_50_plus')?.montant || 0,
      pub_non_num_50_moins: refArticles.find(a => a.meta.refSlot === 'pub_non_num_50_moins')?.montant || 0,
      pub_non_num_50_plus: refArticles.find(a => a.meta.refSlot === 'pub_non_num_50_plus')?.montant || 0,
      pub_num_50_moins: refArticles.find(a => a.meta.refSlot === 'pub_num_50_moins')?.montant || 0,
      pub_num_50_plus: refArticles.find(a => a.meta.refSlot === 'pub_num_50_plus')?.montant || 0
    };

    return NextResponse.json({ 
      configs,
      config, 
      tarifs, 
      articles: parsedArticles 
    });

  } catch (error: any) {
    console.error('TLPE GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { annee, tarifs, exoneration, deliberationPath, tarifsPath, catalogueArticles } = body;

    const anneeInt = parseInt(annee);
    if (!anneeInt) return NextResponse.json({ error: "L'année est requise" }, { status: 400 });

    const exoVal = parseFloat(exoneration?.toString().replace(',', '.')) || 0;

    // 1. Create/Update Config in SQLite
    await prisma.$executeRaw`
      INSERT INTO TlpeConfig (annee, exoneration, deliberationPath, tarifsPath)
      VALUES (${anneeInt}, ${exoVal}, ${deliberationPath}, ${tarifsPath})
      ON CONFLICT(annee) DO UPDATE SET
        exoneration = EXCLUDED.exoneration,
        deliberationPath = EXCLUDED.deliberationPath,
        tarifsPath = EXCLUDED.tarifsPath
    `;

    // 2. Manage Reference Articles (The Slots)
    const refSlots = [
      { slot: 'enseignes_12_50', designation: `TLPE ${anneeInt} - Enseignes (12m² à 50m²)` },
      { slot: 'enseignes_50_plus', designation: `TLPE ${anneeInt} - Enseignes (> 50m²)` },
      { slot: 'pub_non_num_50_moins', designation: `TLPE ${anneeInt} - Dispositifs non-numérique (<= 50m²)` },
      { slot: 'pub_non_num_50_plus', designation: `TLPE ${anneeInt} - Dispositifs non-numérique (> 50m²)` },
      { slot: 'pub_num_50_moins', designation: `TLPE ${anneeInt} - Dispositifs numérique (<= 50m²)` },
      { slot: 'pub_num_50_plus', designation: `TLPE ${anneeInt} - Dispositifs numérique (> 50m²)` }
    ];

    for (const s of refSlots) {
      const montantVal = parseFloat(tarifs[s.slot]?.toString().replace(',', '.')) || 0;
      const meta = JSON.stringify({ annee: anneeInt, isRef: true, refSlot: s.slot });

      // Find by id globally
      const existing = await prisma.$queryRaw`
        SELECT id FROM Article 
        WHERE categorieId = 30 
        AND json_extract(notes, '$.isRef') = true
        AND json_extract(notes, '$.refSlot') = ${s.slot}
        AND json_extract(notes, '$.annee') = ${anneeInt}
      ` as any[];

      if (existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE Article 
          SET montant = ${montantVal}, designation = ${s.designation}, notes = ${meta}, annee = ${anneeInt}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO Article (designation, montant, categorieId, notes, annee, typeMouvement, created_at, updated_at)
          VALUES (${s.designation}, ${montantVal}, 30, ${meta}, ${anneeInt}, 'TLPE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
      }
    }

    // 3. Manage Catalogue Articles
    if (catalogueArticles && Array.isArray(catalogueArticles)) {
      for (const art of catalogueArticles) {
        const meta = JSON.stringify({ annee: anneeInt, tlpeType: art.tlpeType, isCatalogue: true });
        if (art.id && art.id > 0) {
          await prisma.$executeRaw`
            UPDATE Article 
            SET numero = ${art.numero}, designation = ${art.designation}, notes = ${meta}, annee = ${anneeInt}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${art.id}
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO Article (numero, designation, montant, categorieId, notes, annee, typeMouvement, created_at, updated_at)
            VALUES (${art.numero}, ${art.designation}, 0, 30, ${meta}, ${anneeInt}, 'TLPE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('TLPE POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { annee, deleteDelib, deleteTarifs } = body;

    const anneeInt = parseInt(annee);
    if (!anneeInt) return NextResponse.json({ error: "L'année est requise" }, { status: 400 });

    if (deleteDelib) {
      await prisma.$executeRaw`
        UPDATE TlpeConfig
        SET deliberationPath = NULL
        WHERE annee = ${anneeInt}
      `;
    }

    if (deleteTarifs) {
      await prisma.$executeRaw`
        UPDATE TlpeConfig
        SET tarifsPath = NULL
        WHERE annee = ${anneeInt}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('TLPE PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
