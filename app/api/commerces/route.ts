import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url || '');
    const status = searchParams.get('status') || 'ACTIVE'; // default to active ones

    const where: any = {
      type: 'COMMERCE'
    };

    if (status === 'ARCHIVE') {
      where.tiers = { statut: 'ARCHIVE' };
    } else {
      where.tiers = { statut: { not: 'ARCHIVE' } };
    }
    
    // Fetch TLPE configurations for thresholds
    const tlpeConfigs = await (prisma as any).tlpeConfig.findMany();
    const thresholdMap = new Map<number, number>();
    tlpeConfigs.forEach((c: any) => thresholdMap.set(c.annee, c.exoneration));

    // Get all TLPE and COMMERCE occupations with their tiers
    const occupations = await (prisma as any).occupation.findMany({
      where,
      include: {
        tiers: true,
        lignes: {
          include: {
            article: true
          }
        }
      },
      select: {
        id: true,
        type: true,
        statut: true,
        anneeTaxation: true,
        dateDebut: true,
        aotDate: true,
        aotFinalPath: true,
        aotSigned: true,
        tiers: true,
        lignes: {
          include: {
            article: true
          }
        }
      }
    });

    // Deduplicate commerces and collect years and articles by type
    const commercesMap = new Map<number, any>();

    occupations.forEach((occ: any) => {
      if (occ.tiers) {
        const tierId = occ.tiers.id;
        const year = occ.type === 'TLPE' || occ.type === 'COMMERCE'
          ? occ.anneeTaxation
          : (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : null);

        // Count articles by designation, tracking year
        const articleCounts = new Map<string, number>();
        const articleMap = new Map<string, any>();

        occ.lignes.forEach((l: any) => {
          if (l.article && !l.deletedAt) {
            const nom = l.article.designation;
            const count = articleCounts.get(nom) || 0;
            articleCounts.set(nom, count + 1);
            if (!articleMap.has(nom)) {
              articleMap.set(nom, {
                id: l.article.id,
                nom,
                year,
                unitPrice: l.article.montant,
                total: l.montant,
                quantite1: l.quantite1,
                notes_raw: l.article.notes,
                notes: l.note ? [l.note] : []
              });
            } else {
              const existing = articleMap.get(nom);
              if (existing.year === year) {
                existing.total += l.montant;
                existing.quantite1 += l.quantite1;
                if (l.note) existing.notes.push(l.note);
              }
            }
          }
        });

        const articles = Array.from(articleMap.values()).map(a => ({
          ...a,
          count: articleCounts.get(a.nom) || 1
        }));

        if (commercesMap.has(tierId)) {
          const commerce = commercesMap.get(tierId);
          if (occ.type === 'TLPE') {
            if (!commerce.tlpeYears.includes(year)) {
              commerce.tlpeYears.push(year);
            }
            commerce.tlpeCount++;
          } else if (occ.type === 'COMMERCE') {
            if (!commerce.commerceYears.includes(year)) {
              commerce.commerceYears.push(year);
            }
            commerce.commerceCount++;
          }
          
          if (year && (!commerce.lastYearForStatut || year > commerce.lastYearForStatut)) {
            commerce.lastYearStatut = occ.statut;
            commerce.lastYearForStatut = year;
          }

          // Store latest AOT date for COMMERCE type
          if (occ.type === 'COMMERCE') {
            if (!commerce.lastAotDate || (occ.aotDate && new Date(occ.aotDate) > new Date(commerce.lastAotDate))) {
              commerce.lastAotDate = occ.aotDate;
              commerce.lastAotPath = occ.aotFinalPath;
            }
          }

          // Add articles (deduplicate and accumulate counts)
          articles.forEach((article: any) => {
            const existing = commerce.articles.find((a: any) => a.nom === article.nom);
            if (existing) {
              // Only accumulate counts if from the same year, otherwise replace with newer year
              if (existing.year === article.year) {
                existing.count = (existing.count || 0) + (article.count || 0);
              } else if (article.year && (!existing.year || article.year > existing.year)) {
                // Replace with newer year version
                existing.count = article.count || 1;
                existing.year = article.year;
                existing.total = article.total;
                existing.quantite1 = article.quantite1;
                existing.unitPrice = article.unitPrice;
                existing.notes_raw = article.notes_raw;
                existing.notes = article.notes;
              }
            } else {
              commerce.articles.push({ ...article, count: article.count || 1 });
            }
          });
        } else {
          const tlpeYears = occ.type === 'TLPE' ? [year] : [];
          const commerceYears = occ.type === 'COMMERCE' ? [year] : [];
          commercesMap.set(tierId, {
            id: occ.tiers.id,
            nom: occ.tiers.nom,
            adresse: occ.tiers.adresse,
            email: occ.tiers.email,
            tlpeYears: tlpeYears.filter(Boolean),
            commerceYears: commerceYears.filter(Boolean),
            tlpeCount: occ.type === 'TLPE' ? 1 : 0,
            commerceCount: occ.type === 'COMMERCE' ? 1 : 0,
            articles: articles,
            etatAdministratif: occ.tiers.etatAdministratif,
            statut: occ.tiers.statut,
            lastYearStatut: occ.statut,
            lastYearForStatut: year,
            lastAotDate: occ.type === 'COMMERCE' && occ.aotDate ? occ.aotDate : null,
            lastAotPath: occ.type === 'COMMERCE' && occ.aotFinalPath ? occ.aotFinalPath : null
          });
        }
      }
    });

    // Convert to array, sort by name, and filter articles to last year only
    const commerces = Array.from(commercesMap.values()).map(commerce => {
      // Find the latest year across all dossiers
      const allYears = [...commerce.tlpeYears, ...commerce.commerceYears].filter(y => y);
      const lastYear = allYears.length > 0 ? Math.max(...allYears) : null;

      // Filter articles to only those from the last year
      const filteredArticles = lastYear
        ? commerce.articles.filter((a: any) => a.year === lastYear)
        : commerce.articles;

      const lastYearTotal = filteredArticles
        .reduce((sum: number, a: any) => sum + (a.total || 0), 0);
      
      const enseigneSurface = filteredArticles.reduce((sum: number, a: any) => {
        let artNotes: any = {};
        try { artNotes = a.notes_raw ? JSON.parse(a.notes_raw) : {}; } catch(e){}
        const isEnseigne = artNotes.tlpeType === 'ENSEIGNE' || (a.nom && a.nom.toLowerCase().startsWith('enseigne'));
        if (isEnseigne) {
          return sum + (a.quantite1 || 0);
        }
        return sum;
      }, 0);

      return {
        ...commerce,
        articles: filteredArticles,
        lastYear,
        lastYearTotal,
        enseigneSurface,
        threshold: lastYear ? (thresholdMap.get(lastYear) || 12) : 12,
        isExonere: enseigneSurface > 0 && enseigneSurface <= (lastYear ? (thresholdMap.get(lastYear) || 12) : 12),
        lastYearStatut: commerce.lastYearStatut
      };
    }).sort((a, b) => a.nom.localeCompare(b.nom));

    return NextResponse.json(commerces);
  } catch (err: any) {
    console.error('[commerces]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
