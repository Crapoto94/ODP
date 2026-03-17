import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const { file, annee } = await req.json();
    if (!file || !annee) {
      return NextResponse.json({ error: 'Fichier et année requis' }, { status: 400 });
    }

    console.log(`[IMPORT] Starting import for year ${annee}`);

    // Decode base64
    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`[IMPORT] Parsed ${data.length} rows from Excel`);

    const yearInt = parseInt(annee);
    let count = 0;

    for (const row of data) {
      const typeStr = row['Type']?.toString().trim();
      const sousTypeStr = row['Sous type']?.toString().trim();
      const sousSousTypeStr = row['sous sous type']?.toString().trim();
      const designation = row['Designation']?.toString().trim();
      const numero = row['N° Article']?.toString().trim();
      const modeTaxationStr = row['Mode de Taxation']?.toString().trim();
      const tarifRaw = row[`Tarif ${yearInt}`] || row['Tarif 2025'];
      const montant = parseFloat(tarifRaw) || 0;

      if (!designation) continue;

      try {
        // 1. Manage Categories
        let lastCatId: number | null = null;

        if (typeStr) {
          let cat1 = await (prisma as any).categorie.findFirst({
            where: { nom: typeStr, niveau: 1 }
          });
          if (!cat1) {
            cat1 = await (prisma as any).categorie.create({
              data: { nom: typeStr, niveau: 1 }
            });
          }
          lastCatId = cat1.id;

          if (sousTypeStr) {
            let cat2 = await (prisma as any).categorie.findFirst({
              where: { nom: sousTypeStr, parentId: cat1.id, niveau: 2 }
            });
            if (!cat2) {
              cat2 = await (prisma as any).categorie.create({
                data: { nom: sousTypeStr, parentId: cat1.id, niveau: 2 }
              });
            }
            lastCatId = cat2.id;

            if (sousSousTypeStr) {
              let cat3 = await (prisma as any).categorie.findFirst({
                where: { nom: sousSousTypeStr, parentId: cat2.id, niveau: 3 }
              });
              if (!cat3) {
                cat3 = await (prisma as any).categorie.create({
                  data: { nom: sousSousTypeStr, parentId: cat2.id, niveau: 3 }
                });
              }
              lastCatId = cat3.id;
            }
          }
        }

        // 2. Manage Mode Taxation
        let modeId: number | null = null;
        if (modeTaxationStr) {
          let mode = await (prisma as any).modeTaxation.findFirst({
            where: { nom: modeTaxationStr }
          });
          if (!mode) {
            mode = await (prisma as any).modeTaxation.create({
              data: { nom: modeTaxationStr }
            });
          }
          modeId = mode.id;
        }

        // 3. Create or Update Article
        const existingArticle = await (prisma as any).article.findFirst({
          where: { designation, annee: yearInt }
        });

        const articleData = {
          numero,
          designation,
          categorieId: lastCatId,
          modeTaxationId: modeId,
          annee: yearInt,
          montant: montant
        };

        if (existingArticle) {
          await (prisma as any).article.update({
            where: { id: existingArticle.id },
            data: articleData
          });
        } else {
          await (prisma as any).article.create({
            data: articleData
          });
        }
        count++;
      } catch (rowError) {
        console.error(`[IMPORT ERROR] Failed at row: ${designation}`, rowError);
        // Continue to next rows
      }
    }

    console.log(`[IMPORT] Success! Processed ${count} articles.`);
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('[IMPORT GLOBAL ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
