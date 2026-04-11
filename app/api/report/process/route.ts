import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addYears } from 'date-fns';
import { updateOccupationTotal } from '@/lib/tlpe-utils';

export async function POST(req: NextRequest) {
  try {
    const { ids, fromYear, toYear, type } = await req.json();

    if (!ids || ids.length === 0 || !fromYear || !toYear) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }

    const yearDiff = toYear - fromYear;

    // 1. Check if there are any tariffs configured for the toYear
    const anyArticlesToYear = await (prisma as any).article.findFirst({
      where: { annee: toYear }
    });

    if (!anyArticlesToYear) {
      return NextResponse.json({ 
        error: 'Report impossible car tarifs manquants pour l\'année d\'arrivée.', 
        missingAll: true 
      }, { status: 400 });
    }

    // 2. Fetch the dossiers to process
    const dossiers = await (prisma as any).occupation.findMany({
      where: { id: { in: ids } },
      include: { 
        lignes: {
          include: { article: true }
        },
        dispositifs: true
      }
    });

    const results = [];

    // 3. Process each dossier
    for (const oldDossier of dossiers) {
      // Find missing articles per ligne
      let hasError = false;
      const lignesDataToCreate = [];

      for (const ligne of oldDossier.lignes) {
        // Look for the matching article in the destination year (case insensitive match on designation)
        // Note: SQLite is case insensitive natively for string matches, usually
        const targetArticle = await (prisma as any).article.findFirst({
          where: {
            annee: toYear,
            designation: ligne.article?.designation,
            numero: ligne.article?.numero, // matches null if it was null
          }
        });

        if (!targetArticle) {
          hasError = true;
          lignesDataToCreate.push({
            articleId: ligne.articleId, // old year article
            quantite1: ligne.quantite1,
            quantite2: ligne.quantite2,
            dateDebut: ligne.dateDebut ? addYears(new Date(ligne.dateDebut), yearDiff) : null,
            dateFin: ligne.dateFin ? addYears(new Date(ligne.dateFin), yearDiff) : null,
            montant: 0, 
            photos: ligne.photos,
            _hasError: true
          });
        } else {
          lignesDataToCreate.push({
            articleId: targetArticle.id,
            quantite1: ligne.quantite1,
            quantite2: ligne.quantite2,
            dateDebut: ligne.dateDebut ? addYears(new Date(ligne.dateDebut), yearDiff) : null,
            dateFin: ligne.dateFin ? addYears(new Date(ligne.dateFin), yearDiff) : null,
            montant: targetArticle.montant,
            photos: ligne.photos,
            _hasError: false
          });
        }
      }

      // Create duplicated DOSSIER
      const newDossier = await (prisma as any).occupation.create({
        data: {
          nom: oldDossier.nom,
          tiersId: oldDossier.tiersId,
          type: oldDossier.type,
          statut: hasError ? 'ERREUR_TARIF' : 'EN_ATTENTE',
          dateDebut: oldDossier.dateDebut ? addYears(new Date(oldDossier.dateDebut), yearDiff) : null,
          dateFin: oldDossier.dateFin ? addYears(new Date(oldDossier.dateFin), yearDiff) : null,
          anneeTaxation: toYear,
          adresse: oldDossier.adresse,
          latitude: oldDossier.latitude,
          longitude: oldDossier.longitude,
          description: oldDossier.description,
          photos: oldDossier.photos,
          dossierParentId: oldDossier.id,
          // Reset billing info
          montantCalcule: 0,
          facturePath: null,
          numeroFacture: null,
          // Create new dispositifs
          dispositifs: {
            create: oldDossier.dispositifs.map((d: any) => ({
              nom: d.nom,
              statut: 'EN_ATTENTE'
            }))
          },
          // Create new lignes
          lignes: {
            create: lignesDataToCreate.map(({ _hasError, ...l }: any) => l)
          }
        }
      });

      // Recalculate montant for the newly created dossier
      await updateOccupationTotal(newDossier.id);

      results.push({
        oldId: oldDossier.id,
        newId: newDossier.id,
        status: newDossier.statut,
        hasError
      });
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (err: any) {
    console.error('Erreur report annee:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
