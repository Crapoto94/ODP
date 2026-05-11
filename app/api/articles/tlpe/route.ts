import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const annee = searchParams.get('annee');

    // 1. Fetch available years (configs)
    const configs = await (prisma as any).tlpeConfig.findMany({
      orderBy: { annee: 'desc' }
    });

    if (!annee) {
      return NextResponse.json({ configs });
    }

    const anneeInt = parseInt(annee);

    // 2. Fetch Config for specific year
    const config = await (prisma as any).tlpeConfig.findUnique({
      where: { annee: anneeInt }
    });

    // 3. Fetch Articles (Ref + Catalogue) for this specific year
    // We fetch all articles of category 30 and filter in memory to avoid SQLite/Postgres JSON syntax differences
    const allArticles = await (prisma as any).article.findMany({
      where: { categorieId: 30 }
    });

    const parsedArticles = allArticles.map((a: any) => {
      let meta: any = {};
      try {
        if (a.notes) meta = JSON.parse(a.notes);
      } catch (e) {}
      return { ...a, meta };
    }).filter((a: any) => {
      return a.meta.annee === anneeInt || a.meta.isCatalogue === true;
    });

    // 4. Extract Tariffs from Ref Articles
    const refArticles = parsedArticles.filter((a: any) => a.meta.isRef);
    const tarifs = {
      enseignes_12_50: refArticles.find((a: any) => a.meta.refSlot === 'enseignes_12_50')?.montant || 0,
      enseignes_50_plus: refArticles.find((a: any) => a.meta.refSlot === 'enseignes_50_plus')?.montant || 0,
      pub_non_num_50_moins: refArticles.find((a: any) => a.meta.refSlot === 'pub_non_num_50_moins')?.montant || 0,
      pub_non_num_50_plus: refArticles.find((a: any) => a.meta.refSlot === 'pub_non_num_50_plus')?.montant || 0,
      pub_num_50_moins: refArticles.find((a: any) => a.meta.refSlot === 'pub_num_50_moins')?.montant || 0,
      pub_num_50_plus: refArticles.find((a: any) => a.meta.refSlot === 'pub_num_50_plus')?.montant || 0
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

    // 1. Create/Update Config
    const existingConfig = await (prisma as any).tlpeConfig.findUnique({
      where: { annee: anneeInt }
    });

    const configData = {
      annee: anneeInt,
      exoneration: exoVal,
      deliberationPath: deliberationPath || null,
      tarifsPath: tarifsPath || null
    };

    if (existingConfig) {
      await (prisma as any).tlpeConfig.update({
        where: { annee: anneeInt },
        data: configData
      });
    } else {
      await (prisma as any).tlpeConfig.create({
        data: configData
      });
    }

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
      const metaObj = { annee: anneeInt, isRef: true, refSlot: s.slot };
      const meta = JSON.stringify(metaObj);

      // Find existing article for this slot and year
      const existingArticles = await (prisma as any).article.findMany({
        where: { categorieId: 30 }
      });
      
      const existing = existingArticles.find((a: any) => {
        try {
          const m = JSON.parse(a.notes || '{}');
          return m.isRef === true && m.refSlot === s.slot && m.annee === anneeInt;
        } catch (e) { return false; }
      });

      if (existing) {
        await (prisma as any).article.update({
          where: { id: existing.id },
          data: {
            montant: montantVal,
            designation: s.designation,
            notes: meta,
            annee: anneeInt
          }
        });
      } else {
        await (prisma as any).article.create({
          data: {
            designation: s.designation,
            montant: montantVal,
            categorieId: 30,
            notes: meta,
            annee: anneeInt,
            typeMouvement: 'TLPE'
          }
        });
      }
    }

    // 3. Manage Catalogue Articles
    if (catalogueArticles && Array.isArray(catalogueArticles)) {
      for (const art of catalogueArticles) {
        const meta = JSON.stringify({ annee: anneeInt, tlpeType: art.tlpeType, isCatalogue: true });
        if (art.id && art.id > 0) {
          await (prisma as any).article.update({
            where: { id: art.id },
            data: {
              numero: art.numero,
              designation: art.designation,
              notes: meta,
              annee: anneeInt
            }
          });
        } else {
          await (prisma as any).article.create({
            data: {
              numero: art.numero,
              designation: art.designation,
              montant: 0,
              categorieId: 30,
              notes: meta,
              annee: anneeInt,
              typeMouvement: 'TLPE'
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TLPE-POST-ERROR]', error.message);
    if (error.stack) console.error(error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { annee, deleteDelib, deleteTarifs } = body;

    const anneeInt = parseInt(annee);
    if (!anneeInt) return NextResponse.json({ error: "L'année est requise" }, { status: 400 });

    const data: any = {};
    if (deleteDelib) data.deliberationPath = null;
    if (deleteTarifs) data.tarifsPath = null;

    if (Object.keys(data).length > 0) {
      await (prisma as any).tlpeConfig.update({
        where: { annee: anneeInt },
        data
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('TLPE PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
