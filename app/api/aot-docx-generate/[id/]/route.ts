import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: occupationId } = await params;
    const occId = parseInt(occupationId);

    console.log('[AOT DOCX Generate] Starting generation for occupation:', occId);

    // Fetch occupation with all relations
    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: occId },
      include: {
        tiers: { include: { contacts: true } },
        lignes: { include: { article: { include: { modeTaxation: true, categorie: true } } } },
        contacts: true,
      }
    });

    if (!occupation) {
      return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
    }

    console.log('[AOT DOCX Generate] aotGabaritId:', occupation.aotGabaritId);

    if (!occupation.aotGabaritId) {
      return NextResponse.json({ error: 'No AOT template selected' }, { status: 400 });
    }

    // Fetch the DOCX gabarit
    const gabarit = await (prisma as any).gabarit.findUnique({
      where: { id: occupation.aotGabaritId }
    });

    if (!gabarit) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    console.log('[AOT DOCX Generate] Template fichierPath:', gabarit.fichierPath);

    // Read the DOCX file
    const filePath = join(process.cwd(), 'public', gabarit.fichierPath.replace(/^\//, ''));
    console.log('[AOT DOCX Generate] Reading file from:', filePath);
    const fileBuffer = await readFile(filePath);

    // Load DOCX as ZIP
    const zip = new JSZip();
    await zip.loadAsync(fileBuffer);

    // Read document.xml
    let documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) {
      return NextResponse.json({ error: 'Invalid DOCX structure' }, { status: 400 });
    }

    console.log('[AOT DOCX Generate] Original XML length:', documentXml.length);

    // Get app settings for signatory info
    const settings = await (prisma as any).appSettings.findFirst();

    // Build contact info
    const mainContact = occupation.contacts?.[0] || occupation.tiers?.contacts?.[0];
    const demandeurComplet = mainContact
      ? `${mainContact.prenom || ''} ${mainContact.nom || ''}`.trim()
      : (occupation.tiers?.nom || '');

    // Today's date
    const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });

    // Signatory info
    const signataireNom = settings?.signataireNom || '';
    const signataireRole = settings?.signataireRole || '';
    const signataireDelegation = settings?.signataireDelegation || '';

    // Build variables object
    const variables: Record<string, string> = {
      // Dossier info
      '{id}': escapeXml(occupation.id.toString()),
      '{nom}': escapeXml(occupation.nom || ''),
      '{adresse}': escapeXml(occupation.adresse || ''),
      '{type}': escapeXml(occupation.type || ''),
      '{statut}': escapeXml(occupation.statut || ''),
      '{dateDebut}': escapeXml(occupation.dateDebut ? format(new Date(occupation.dateDebut), 'dd/MM/yyyy') : ''),
      '{dateFin}': escapeXml(occupation.dateFin ? format(new Date(occupation.dateFin), 'dd/MM/yyyy') : ''),
      '{anneeTaxation}': escapeXml(occupation.anneeTaxation?.toString() || ''),
      '{description}': escapeXml(occupation.description || ''),

      // Tiers info
      '{tiers.nom}': escapeXml(occupation.tiers?.nom || ''),
      '{tiers.siret}': escapeXml(occupation.tiers?.siret || ''),
      '{tiers.email}': escapeXml(occupation.tiers?.email || ''),
      '{tiers.adresse}': escapeXml(occupation.tiers?.adresse || ''),

      // Contact info
      '{demandeurComplet}': escapeXml(demandeurComplet),
      '{contact.nom}': escapeXml(mainContact?.nom || ''),
      '{contact.prenom}': escapeXml(mainContact?.prenom || ''),
      '{contact.email}': escapeXml(mainContact?.email || ''),
      '{contact.telephone}': escapeXml(mainContact?.telephone || ''),
      '{contact.role}': escapeXml(mainContact?.role || ''),

      // Date
      '{today}': escapeXml(today),

      // Signatory
      '{signataireNom}': escapeXml(signataireNom),
      '{signataireRole}': escapeXml(signataireRole),
      '{signataireDelegation}': escapeXml(signataireDelegation),
    };

    // Add article variables
    if (occupation.lignes && occupation.lignes.length > 0) {
      occupation.lignes.forEach((ligne, index) => {
        const num = index + 1;
        variables[`{article${num}.numero}`] = escapeXml(ligne.article?.numero || '');
        variables[`{article${num}.designation}`] = escapeXml(ligne.article?.designation || '');
        variables[`{article${num}.montant}`] = escapeXml(ligne.article?.montant?.toString() || '0');
        variables[`{article${num}.quantite1}`] = escapeXml(ligne.quantite1?.toString() || '0');
        variables[`{article${num}.quantite2}`] = escapeXml(ligne.quantite2?.toString() || '0');
        variables[`{article${num}.dateDebut}`] = escapeXml(ligne.dateDebut ? format(new Date(ligne.dateDebut), 'dd/MM/yyyy') : '');
        variables[`{article${num}.dateFin}`] = escapeXml(ligne.dateFin ? format(new Date(ligne.dateFin), 'dd/MM/yyyy') : '');
      });
    }

    // Replace variables in document.xml
    let modifiedXml = documentXml;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\]/g, '\$&'), 'g');
      modifiedXml = modifiedXml.replace(regex, value);
    }

    console.log('[AOT DOCX Generate] XML replaced, new length:', modifiedXml.length);

    // Update the document.xml in the ZIP
    zip.file('word/document.xml', modifiedXml);

    // Generate the new DOCX
    const modifiedDocx = await zip.generateAsync({ type: 'arraybuffer' });

    console.log('[AOT DOCX Generate] ✅ Generation complete, size:', modifiedDocx.byteLength);

    // Return as DOCX file
    return new NextResponse(modifiedDocx, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="AOT-${occId}.docx"`
      }
    });
  } catch (err: any) {
    console.error('[AOT DOCX Generate] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
