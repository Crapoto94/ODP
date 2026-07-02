import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { replaceVariablesInDocx, buildAotVariables } from '@/lib/aot/docx-fill';

// POST: (re)génère le document AOT d'une autorisation à partir de son gabarit
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = { prenom: session.prenom || '', nom: session.nom || '' };

    const { id } = await params;
    const autorisationId = parseInt(id);

    const autorisation = await (prisma as any).autorisation.findUnique({
      where: { id: autorisationId },
    });
    if (!autorisation) {
      return NextResponse.json({ error: 'Autorisation introuvable' }, { status: 404 });
    }

    const [occ, settings] = await Promise.all([
      (prisma as any).occupation.findUnique({
        where: { id: autorisation.occupationId },
        include: {
          tiers: { include: { contacts: true } },
          lignes: { include: { article: { include: { modeTaxation: true } } } },
        },
      }),
      (prisma as any).appSettings.findFirst(),
    ]);
    if (!occ) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });

    // Résolution du gabarit : celui de l'autorisation, sinon défaut DOCX, sinon premier DOCX
    let gabarit: any = null;
    if (autorisation.gabaritId) {
      gabarit = await (prisma as any).gabarit.findUnique({ where: { id: autorisation.gabaritId } });
    }
    if (!gabarit) {
      gabarit = await (prisma as any).gabarit.findFirst({ where: { type: 'DOCX', isDefault: true } });
    }
    if (!gabarit) {
      gabarit = await (prisma as any).gabarit.findFirst({ where: { type: 'DOCX' } });
    }
    if (!gabarit || !gabarit.fichierPath) {
      return NextResponse.json(
        { error: 'Aucun gabarit DOCX disponible pour générer l\'AOT.' },
        { status: 400 }
      );
    }

    const templatePath = join(process.cwd(), 'public', gabarit.fichierPath);
    let docxBuffer: Buffer;
    try {
      docxBuffer = await readFile(templatePath);
    } catch {
      return NextResponse.json(
        { error: `Fichier gabarit introuvable: ${gabarit.fichierPath}` },
        { status: 500 }
      );
    }

    // Sous-ensemble de lignes couvertes par l'autorisation (si défini)
    let scopedLignes: any[] | undefined;
    if (autorisation.ligneIds) {
      try {
        const ids: number[] = JSON.parse(autorisation.ligneIds);
        if (Array.isArray(ids) && ids.length > 0) {
          scopedLignes = (occ.lignes || []).filter((l: any) => ids.includes(l.id));
        }
      } catch {}
    }

    // Résolution du tiers "agissant pour"
    let agissantPourTier: any = null;
    if (occ.agissantPour) {
      const apId = parseInt(occ.agissantPour);
      if (!isNaN(apId)) {
        agissantPourTier = await (prisma as any).tiers.findUnique({ where: { id: apId } });
      }
    }

    const variables = buildAotVariables(occ, settings, currentUser, {
      lignes: scopedLignes,
      dateDebut: autorisation.dateDebut,
      dateFin: autorisation.dateFin,
      libelle: autorisation.libelle,
      agissantPourTier,
    });

    const filledDocx = await replaceVariablesInDocx(docxBuffer, variables);

    // Écriture du DOCX généré
    const outDir = join(process.cwd(), 'public', 'autorisations');
    if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
    const docxName = `autorisation-${autorisationId}.docx`;
    const docxAbs = join(outDir, docxName);
    await writeFile(docxAbs, filledDocx);
    const generatedPath = `/autorisations/${docxName}`;

    // Pas de conversion PDF à la volée : on stocke le DOCX généré (style AOT).
    const updated = await (prisma as any).autorisation.update({
      where: { id: autorisationId },
      data: { generatedPath, generatedPdf: null },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[POST autorisation generate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
