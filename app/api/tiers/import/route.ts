import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBusinessesByCity } from '@/lib/insee';

export async function POST(req: Request) {
  try {
    const { businesses } = await req.json();

    if (!businesses || !Array.isArray(businesses)) {
      return NextResponse.json({ error: 'Liste d\'entreprises invalide' }, { status: 400 });
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let foldersCreated = 0;

    for (const biz of businesses) {
      if (!biz.siret) continue;

      let tiers = await (prisma as any).tiers.findFirst({
        where: { siret: biz.siret }
      });

      if (!tiers) {
        tiers = await (prisma as any).tiers.create({
          data: {
            nom: biz.nom,
            siret: biz.siret,
            adresse: biz.adresse,
            latitude: biz.latitude || null,
            longitude: biz.longitude || null,
            email: '', 
            statut: 'PROVISOIRE'
          }
        });
        importedCount++;
      } else {
        skippedCount++;
      }

      // Automatically create a "dossier" (Occupation) if it doesn't exist for this commerce
      const existingFolder = await (prisma as any).occupation.findFirst({
        where: { 
          tiersId: tiers.id,
          type: 'COMMERCE'
        }
      });

      if (!existingFolder) {
        await (prisma as any).occupation.create({
          data: {
            tiersId: tiers.id,
            nom: `Dossier ${biz.nom}`,
            type: 'COMMERCE',
            statut: 'EN_ATTENTE',
            dateDebut: new Date(),
            dateFin: new Date(new Date().getFullYear(), 11, 31), // End of current year
            adresse: biz.adresse || 'Ivry-sur-Seine',
            description: 'Dossier créé automatiquement lors de l\'import massif.'
          }
        });
        foldersCreated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      skipped: skippedCount,
      foldersCreated,
      total: businesses.length
    });
  } catch (error: any) {
    console.error('[IMPORT] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
