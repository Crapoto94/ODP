import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFilienFile, FilienParams, FilienMovement, FilienLine } from '@/lib/filien';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    const settings = await prisma.appSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Paramètres Filien non configurés' }, { status: 500 });
    }

    const filienParams: FilienParams = {
      orga: (settings as any).filienOrga || '01',
      budget: (settings as any).filienBudget || 'BA',
      exercice: (settings as any).filienExercice || new Date().getFullYear(),
      avancement: (settings as any).filienAvancement || '5',
      rejetDispo: (settings as any).filienRejetDispo ?? true,
      rejetCA: (settings as any).filienRejetCA ?? false,
      rejetMarche: (settings as any).filienRejetMarche ?? false,
      filienChapitre: (settings as any).filienChapitre || '',
      filienNature: (settings as any).filienNature || '',
      filienFonction: (settings as any).filienFonction || '',
      filienCodeInterne: (settings as any).filienCodeInterne || '',
      filienTypeMouvement: (settings as any).filienTypeMouvement || '',
      filienSens: (settings as any).filienSens || '',
      filienStructure: (settings as any).filienStructure || '',
      filienGestionnaire: (settings as any).filienGestionnaire || '',
    };

    const occupations = await prisma.occupation.findMany({
      where: { id: { in: ids.map((id: any) => parseInt(id)) } },
      include: {
        tiers: true,
        lignes: {
          include: {
            article: true
          }
        }
      }
    });

    const startMouvement = (settings as any).filienMouvement || "1";
    const startNum = parseInt(startMouvement);
    const isAlphanumeric = isNaN(startNum);

    const movements: FilienMovement[] = occupations.map((occ, idx) => {
      let movId = startMouvement;
      if (!isAlphanumeric) {
        movId = (startNum + idx).toString().padStart(10, '0');
      } else {
        // If alphanumeric, append index if multiple occupations, else use as is
        movId = occupations.length > 1
          ? `${startMouvement}${idx + 1}`.slice(0, 10)
          : startMouvement.slice(0, 10);
      }

      return {
        id: movId,
        type: (settings as any).filienType || 'R',
        tiersCode: (occ.tiers as any)?.code_sedit || 'TIERS_INCONNU',
        libelle: (settings as any).filienLibelle || occ.nom || `Dossier #${occ.id}`,
        calendrier: (settings as any).filienCalendrier || '01',
        monnaie: (settings as any).filienMonnaie || 'E',
        existant: (settings as any).filienMouvementEx || 'N',
        preBordereau: (settings as any).filienPreBordereau || '1235',
        poste: (settings as any).filienPoste || '0001',
        bordereau: (settings as any).filienBordereau || '0001',
        objet: (settings as any).filienObjet || '',
        lines: occ.lignes.map((l, lIdx) => ({
          numero: lIdx + 1,
          imputation: l.article?.numero || 'IMPUT_VIDE',
          montant: l.montant,
          dateDebut: l.dateDebut || undefined,
          dateFin: l.dateFin || undefined,
          description: l.article?.designation || '',
          quantite: (l as any).quantite || 1,
          prixUnitaire: l.montant || 0,
          // Analytical Ventilation
          chapitre: (l.article as any)?.chapitre || '',
          nature: (l.article as any)?.nature || '',
          fonction: (l.article as any)?.fonction || '',
          codeInterne: (l.article as any)?.codeInterne || '',
          typeMouvement: (l.article as any)?.typeMouvement || '',
          sens: (l.article as any)?.sens || '',
          structure: (l.article as any)?.structure || '',
          gestionnaire: (l.article as any)?.gestionnaire || ''
        }))
      };
    });

    const fileContent = generateFilienFile(filienParams, movements);

    // Return as a downloadable text file
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="filien_${format(new Date(), 'yyyyMMdd_HHmm')}.txt"`
      }
    });

  } catch (error: any) {
    console.error('Filien generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function format(date: Date, str: string) {
  // Simple custom formatter to avoid extra dependencies if needed, 
  // but date-fns is already in the project.
  const { format: dfmt } = require('date-fns');
  return dfmt(date, str);
}
