import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[tlpe] Starting query...');
    const occupations = await (prisma as any).occupation.findMany({
      where: {
        type: 'TLPE'
      },
      include: {
        tiers: true,
        lignes: {
          include: {
            article: true
          }
        }
      }
    });
    console.log('[tlpe] Found', occupations.length, 'dossiers');

    const dossiers = occupations.map((occ: any) => {
      const articleMap = new Map<string, { id: number; count: number }>();

      (occ.lignes || []).forEach((ligne: any) => {
        if (ligne.article) {
          const articleName = ligne.article.designation || ligne.article.nom || 'Unknown';
          if (articleMap.has(articleName)) {
            const existing = articleMap.get(articleName)!;
            existing.count++;
          } else {
            articleMap.set(articleName, {
              id: ligne.article.id,
              count: 1
            });
          }
        }
      });

      const articles = Array.from(articleMap.entries()).map(([nom, data]) => ({
        id: data.id,
        nom,
        count: data.count
      }));

      return {
        id: occ.id,
        numero: occ.numero || `Dossier ${occ.id}`,
        dateDebut: occ.dateDebut,
        dateFin: occ.dateFin,
        montant: occ.montantCalcule || 0,
        statut: occ.statut,
        tiers: {
          id: occ.tiers?.id,
          nom: occ.tiers?.nom || '',
          prenom: occ.tiers?.prenom,
          adresse: occ.tiers?.adresse,
          email: occ.tiers?.email
        },
        articles
      };
    });

    return NextResponse.json(dossiers);
  } catch (err: any) {
    console.error('[tlpe] Error:', err.message);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
