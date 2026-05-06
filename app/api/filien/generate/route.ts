import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { prepareFilienMovements, exportToUnc } from '@/lib/billing-service';
import { generateFilienFile, FilienParams } from '@/lib/filien';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  console.log('[Filien] Generation request started');
  try {
    const { ids } = await req.json();
    console.log('[Filien] IDs received:', ids);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    const settings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
    if (!settings) {
      console.error('[Filien] Settings not found');
      return NextResponse.json({ error: 'Paramètres Filien non configurés' }, { status: 500 });
    }

    const currentYear = new Date().getFullYear();

    const filienParams: FilienParams = {
      orga: (settings as any).filienOrga || '01',
      budget: (settings as any).filienBudget || 'BA',
      exercice: (settings as any).filienExercice || currentYear,
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
    console.log('[Filien] Occupations found:', occupations.length);

    // Fetch all tiers to handle agissantPour mapping
    const allTiers = await prisma.tiers.findMany();
    const tiersMap = allTiers.reduce((acc: any, t: any) => ({ ...acc, [t.id]: t }), {});

    const typeConfigs = await (prisma as any).typeDossierConfig.findMany();
    const typeConfigMap: Record<string, any> = typeConfigs.reduce((acc: any, tc: any) => ({ ...acc, [tc.type]: tc }), {});

    const regulatoryConfig = await prisma.odpConfig.findFirst({
      where: { annee: currentYear }
    });

    // Prepare standardized results for the shared service
    const results = occupations.map(occ => {
      // Priorité au "Débiteur" (agissantPour) si coché
      let activeTiers = occ.tiers;
      if (occ.agissantPour && occ.isAgissantPourBillable) {
        const apId = parseInt(occ.agissantPour);
        if (!isNaN(apId) && tiersMap[apId]) {
          activeTiers = tiersMap[apId];
        }
      }

      return {
        id: occ.id,
        numero: occ.numeroFacture || `${currentYear}-ODP-${occ.id}`,
        path: occ.facturePath,
        tiers: activeTiers?.nom || 'INCONNU',
        tiersCode: activeTiers?.code_sedit || '',
        total: occ.montantCalcule || 0,
        lignes: occ.lignes.map(l => ({ ...l, calculatedTotal: l.montant }))
      };
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const runName = `EXPORT-${timestamp}`;
    const filienFilename = `${runName}.filien`;
    const facturesDir = join(process.cwd(), 'public', 'Factures');

    const movements = prepareFilienMovements(results, occupations, settings, regulatoryConfig, currentYear, runName);
    
    // Apply specific overrides from type configs if applicable
    movements.forEach((mov: any, idx: number) => {
      const occ = occupations[idx];
      const tc = typeConfigMap[occ.type] || {};
      if (tc.filienObjet) mov.objet = tc.filienObjet;
      if (tc.filienPreBordereau) mov.preBordereau = tc.filienPreBordereau;
      
      // Analytical overrides
      if (tc.filienChapitre) mov.lines.forEach((l: any) => l.chapitre = tc.filienChapitre);
      if (tc.filienNature) mov.lines.forEach((l: any) => l.nature = tc.filienNature);
      if (tc.filienFonction) mov.lines.forEach((l: any) => l.fonction = tc.filienFonction);
      if (tc.filienCodeInterne) mov.lines.forEach((l: any) => l.codeInterne = tc.filienCodeInterne);
      if (tc.filienTypeMouvement) mov.lines.forEach((l: any) => l.typeMouvement = tc.filienTypeMouvement);
      if (tc.filienSens) mov.lines.forEach((l: any) => l.sens = tc.filienSens);
      if (tc.filienStructure) mov.lines.forEach((l: any) => l.structure = tc.filienStructure);
      if (tc.filienGestionnaire) mov.lines.forEach((l: any) => l.gestionnaire = tc.filienGestionnaire);
    });

    const fileContent = generateFilienFile(filienParams, movements);

    // Automatically copy to UNC if configured (Sync with main billing process)
    if ((settings as any).filienUncPj) {
      try {
        await exportToUnc({
          uncDir: (settings as any).filienUncPj,
          runName,
          filienContent: fileContent,
          filienFilename,
          results,
          tlpeConfig: regulatoryConfig,
          facturesDir,
          appSettings: settings,
          dossiers: occupations
        });
      } catch (uncError: any) {
        console.error('[Filien] UNC export FAILED:', uncError);
        throw new Error(`Erreur lors de la copie UNC : ${uncError.message}`);
      }
    }

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filienFilename}"`
      }
    });

  } catch (error: any) {
    console.error('[Filien] CRITICAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
