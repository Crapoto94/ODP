import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFilienFile, FilienParams } from '@/lib/filien';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Aucun dossier sélectionné' }, { status: 400 });
    }

    const settingsRecords = await (prisma as any).$queryRaw`SELECT * FROM AppSettings WHERE id = 1`;
    const settings = (settingsRecords as any[])[0] || null;
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

    const typeConfigs = await (prisma as any).typeDossierConfig.findMany();
    const typeConfigMap: Record<string, any> = typeConfigs.reduce((acc: any, tc: any) => ({ ...acc, [tc.type]: tc }), {});

    const year = new Date().getFullYear();
    const records = await (prisma as any).$queryRaw`SELECT * FROM TlpeConfig WHERE annee = ${year}` as any[];
    const tlpeConfig = records[0] || null;

    const { prepareFilienMovements, exportToUnc, generateFilienFile } = require('@/lib/billing-service');

    // Prepare standardized results for the shared service
    const results = occupations.map(occ => ({
      id: occ.id,
      numero: occ.numeroFacture || `${year}-ODP-${occ.id}`,
      path: occ.facturePath || '',
      tiers: (occ.tiers as any)?.nom || 'INCONNU',
      total: occ.montantCalcule || 0,
      lignes: occ.lignes.map(l => ({ ...l, calculatedTotal: l.montant }))
    }));

    const { format } = require('date-fns');
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const runName = `EXPORT-${timestamp}`;
    const filienFilename = `${runName}.filien`;
    const facturesDir = join(process.cwd(), 'public', 'Factures');

    const movements = prepareFilienMovements(results, occupations, settings, tlpeConfig, year, runName);

    // Apply specific overrides from type configs if applicable
    movements.forEach((mov: any, idx: number) => {
      const occ = occupations[idx];
      const tc = typeConfigMap[occ.type] || {};
      if (tc.filienObjet) mov.objet = tc.filienObjet;
    });

    const fileContent = generateFilienFile(filienParams, movements);

    // Automatically copy to UNC if configured (Sync with main billing process)
    if ((settings as any).filienUncPj) {
      await exportToUnc({
        uncDir: (settings as any).filienUncPj,
        runName,
        filienContent: fileContent,
        filienFilename,
        results,
        tlpeConfig,
        facturesDir,
        appSettings: settings // Pass settings here
      });
    }

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filienFilename}"`
      }
    });

  } catch (error: any) {
    console.error('Filien generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
