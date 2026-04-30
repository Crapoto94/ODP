import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

// Dynamic import for jszip
let JSZip: any = null;

// Simple variable replacer for DOCX
const replaceVariablesInDocx = async (docxBuffer: Buffer, variables: Record<string, string>) => {
  // Lazy load jszip
  if (!JSZip) {
    JSZip = (await import('jszip')).default;
  }
  const zip = new JSZip();
  await zip.loadAsync(docxBuffer);

  // Get the document.xml file
  let documentXml = await zip.file('word/document.xml').async('text');

  // STEP 1: Clean up fragmented variables in Word XML
  // Word fragments variables like {demandeurComplet} with <w:proofErr> tags between them
  // Remove all XML tags that are inside curly braces
  documentXml = documentXml.replace(/\{[^}]*?\}/g, (match: string) => {
    // Remove all XML tags within the variable
    return match.replace(/<[^>]+>/g, '');
  });

  // STEP 1.5: Handle conditional blocks {IF variableName|conditionalText}
  // This allows text to appear only if a variable has a value
  documentXml = processConditionals(documentXml, variables);

  // STEP 2: Replace variables in the cleaned XML
  let modifiedXml = documentXml;
  Object.entries(variables)
    .sort((a, b) => b[0].length - a[0].length)  // Replace longer variables first to avoid partial matches
    .forEach(([key, value]) => {
      // Create regex that matches the variable
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      modifiedXml = modifiedXml.replace(regex, escapeXml(value));
    });

  // Update the document.xml in the zip
  zip.file('word/document.xml', modifiedXml);

  // Generate the modified DOCX
  return await zip.generateAsync({ type: 'nodebuffer' });
};

const processConditionals = (xml: string, variables: Record<string, string>): string => {
  let result = xml;

  // Match {IF variableName|conditionalText}
  // The closing } is found by counting nested braces
  const ifRegex = /\{IF\s+(\w+(?:\.\w+)*)\|/g;

  const matches: Array<{ index: number; length: number; variableKey: string; conditionalText: string }> = [];

  let match;
  while ((match = ifRegex.exec(xml)) !== null) {
    const startIndex = match.index;
    const variableKey = match[1];
    const textStartIndex = match.index + match[0].length;

    // Find the closing } by counting nested braces
    let braceCount = 1;
    let endIndex = textStartIndex;
    while (endIndex < xml.length && braceCount > 0) {
      if (xml[endIndex] === '{') braceCount++;
      if (xml[endIndex] === '}') braceCount--;
      endIndex++;
    }

    const conditionalText = xml.substring(textStartIndex, endIndex - 1);
    matches.push({
      index: startIndex,
      length: endIndex - startIndex,
      variableKey,
      conditionalText,
    });
  }

  // Process matches in reverse order to maintain indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const variableValue = variables[`{${m.variableKey}}`];
    const replacement = variableValue && variableValue.trim() !== '' ? m.conditionalText : '';
    result = result.substring(0, m.index) + replacement + result.substring(m.index + m.length);
  }

  return result;
};

const escapeXml = (str: string) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

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
      prisma.appSettings.findFirst()
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
    const tiersNom = occ.tiers?.nom || '';
    const nature = occ.tiers?.natureJuridique ? `${occ.tiers.natureJuridique} ` : '';
    const agissant = (occ as any).agissantPour ? `, agissant pour le compte de ${(occ as any).agissantPour}` : '';
    const demandeurComplet = `Vu la pétition par laquelle ${nature}${tiersNom}${agissant}, demande l'autorisation d'occuper le domaine public à Ivry-sur-Seine par :`;

    // Get contact principal if exists
    const contactPrincipal = (occ.tiers as any)?.contacts?.find((c: any) => c.role === 'Contact principal');

    // Get agissant pour tier if exists
    let agissantPourTier: any = null;
    if ((occ as any).agissantPour) {
      const apId = parseInt((occ as any).agissantPour);
      if (!isNaN(apId)) {
        agissantPourTier = await prisma.tiers.findUnique({
          where: { id: apId }
        });
      }
    }

    const variables: Record<string, string> = {
      '{id}': occ.id.toString(),
      '{nom}': occ.nom || '',
      '{tiers.nom}': occ.tiers?.nom || '',
      '{tiers.adresse}': (occ.tiers as any)?.adresse || '',
      '{demandeurComplet}': demandeurComplet,
      '{adresse}': occ.adresse || '',
      '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
      '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
      '{agissantPour}': (occ as any).agissantPour || '',
      '{today}': format(new Date(), 'dd/MM/yyyy'),
      '{signataireRole}': settings?.signataireRole || '',
      '{signataireDelegation}': settings?.signataireDelegation || '',
      '{signataireNom}': settings?.signataireNom || '',
      '{contact.prenom}': contactPrincipal?.prenom || '',
      '{contact.nom}': contactPrincipal?.nom || '',
      '{contact.email}': contactPrincipal?.email || '',
      '{contact.telephone}': contactPrincipal?.telephone || '',
      '{contact.titre}': contactPrincipal?.titre || '',
      '{contact.entreprise}': contactPrincipal?.entreprise || '',
      '{technicien.prenom}': currentUser.prenom,
      '{technicien.nom}': currentUser.nom,
      '{agissantPourTier.nom}': agissantPourTier?.nom || '',
      '{agissantPourTier.adresse}': agissantPourTier?.adresse || '',
    };

    // Add article variables for each ligne
    if (occ.lignes && occ.lignes.length > 0) {
      occ.lignes.forEach((ligne, idx) => {
        const i = idx + 1;
        variables[`{article${i}.designation}`] = ligne.article?.designation || '';
        variables[`{article${i}.quantite}`] = (ligne.quantite1 || 0).toString();
        variables[`{article${i}.pu}`] = (ligne.article?.montant || 0).toString();
        variables[`{article${i}.note}`] = (ligne as any).note || '';

        if (ligne.dateDebut && ligne.dateFin) {
          const d1 = new Date(ligne.dateDebut);
          const d2 = new Date(ligne.dateFin);
          variables[`{article${i}.dates}`] = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
        } else {
          variables[`{article${i}.dates}`] = '';
        }

        variables[`{article${i}.details}`] = `${ligne.quantite1} ${ligne.article.modeTaxation?.nom || 'unité(s)'}`;
      });
    }

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
