import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { replaceVariablesInDocx, buildAotVariables } from '@/lib/aot/docx-fill';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    // 0. Get current user from session
    let currentUser = { prenom: '', nom: '' };
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;
      if (sessionToken) {
        const session = await decrypt(sessionToken);
        if (session) {
          currentUser = {
            prenom: session.prenom || '',
            nom: session.nom || ''
          };
        }
      }
    } catch (e) {
      console.warn('[AOT DOCX] Could not retrieve current user session');
    }

    // 1. Fetch occupation and settings
    const [occ, settings] = await Promise.all([
      prisma.occupation.findUnique({
        where: { id },
        include: {
          tiers: { include: { contacts: true } },
          lignes: { include: { article: { include: { modeTaxation: true } } } }
        }
      }),
      (prisma as any).appSettings.findFirst()
    ]);

    if (!occ) return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });

    // 2. Get DOCX gabarit
    let gabarit: any = null;

    // Try to get the occupation's specific AOT gabarit first
    if ((occ as any).aotGabaritId) {
      try {
        gabarit = await (prisma as any).gabarit.findUnique({
          where: { id: (occ as any).aotGabaritId }
        });

        if (!gabarit) {
          console.warn(`[AOT DOCX] AOT gabarit ${(occ as any).aotGabaritId} not found for occupation ${id}`);
        }
      } catch (err) {
        console.warn(`[AOT DOCX] Error fetching occupation-specific gabarit:`, err);
      }
    }

    // If no specific gabarit, try to find a default DOCX gabarit
    if (!gabarit) {
      try {
        gabarit = await (prisma as any).gabarit.findFirst({
          where: { type: 'DOCX', isDefault: true }
        });
      } catch (err) {
        console.warn(`[AOT DOCX] Error fetching default DOCX gabarit:`, err);
      }
    }

    // If still no gabarit, list all DOCX gabarits for debugging
    if (!gabarit) {
      try {
        const allDocxGabarits = await (prisma as any).gabarit.findMany({
          where: { type: 'DOCX' }
        });
        console.warn(`[AOT DOCX] No default DOCX gabarit found. Available DOCX gabarits: ${allDocxGabarits.length}`);
        if (allDocxGabarits.length > 0) {
          gabarit = allDocxGabarits[0];
          console.log(`[AOT DOCX] Using first available DOCX gabarit: ${gabarit.nom} (id: ${gabarit.id})`);
        }
      } catch (err) {
        console.error(`[AOT DOCX] Error listing DOCX gabarits:`, err);
      }
    }

    if (!gabarit) {
      return NextResponse.json({
        error: 'Aucun gabarit DOCX défini. Veuillez d\'abord créer ou télécharger un gabarit AOT.'
      }, { status: 500 });
    }

    if (!gabarit.fichierPath) {
      return NextResponse.json({
        error: `Le gabarit DOCX "${gabarit.nom}" n'a pas de fichier associé. Veuillez le réenvoyer.`
      }, { status: 500 });
    }

    // 3. Read the DOCX template file
    const templatePath = join(process.cwd(), 'public', gabarit.fichierPath);
    let docxBuffer: Buffer;
    try {
      docxBuffer = await readFile(templatePath);
      console.log(`[AOT DOCX] Successfully read template file: ${templatePath}`);
    } catch (err: any) {
      console.error(`[AOT DOCX] File read error for path ${templatePath}:`, err);
      return NextResponse.json({
        error: `Fichier gabarit non trouvé: ${gabarit.fichierPath}\nChemin cherché: ${templatePath}`
      }, { status: 500 });
    }

    // 4. Prepare variables for replacement
    // Get agissant pour tier if exists
    let agissantPourTier: any = null;
    if ((occ as any).agissantPour) {
      const apId = parseInt((occ as any).agissantPour);
      if (!isNaN(apId)) {
        agissantPourTier = await prisma.tiers.findUnique({ where: { id: apId } });
      }
    }

    const variables = buildAotVariables(occ, settings, currentUser, { agissantPourTier });

    // 5. Replace variables in DOCX
    let modifiedDocxBuffer: Buffer;
    try {
      console.log(`[AOT DOCX] Replacing ${Object.keys(variables).length} variables in template...`);
      modifiedDocxBuffer = await replaceVariablesInDocx(docxBuffer, variables);
      console.log(`[AOT DOCX] Successfully generated DOCX for occupation ${id}`);
    } catch (err: any) {
      console.error('[AOT DOCX] Error during XML replacement:', err);
      return NextResponse.json({
        error: `Erreur lors du remplissage du modèle: ${err.message}`
      }, { status: 500 });
    }

    return new Response(modifiedDocxBuffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="AOT-${occ.id}.docx"`,
      },
    });
  } catch (err: any) {
    console.error('[AOT DOCX GENERATE ERROR]', err);
    return NextResponse.json({
      error: `Erreur lors de la génération de l'AOT: ${err.message || 'Erreur inconnue'}`
    }, { status: 500 });
  }
}
