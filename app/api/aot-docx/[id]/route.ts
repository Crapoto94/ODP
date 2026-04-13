import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Document, Packer, Paragraph, TextRun, UnderlineType, AlignmentType, convertInchesToTwip } from 'docx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    // 1. Fetch data
    const [occ, settings] = await Promise.all([
      prisma.occupation.findUnique({
        where: { id },
        include: {
          tiers: true,
          lignes: { include: { article: { include: { modeTaxation: true } } } }
        }
      }),
      prisma.appSettings.findFirst()
    ]);

    if (!occ) return NextResponse.json({ error: 'Occupation non trouvée' }, { status: 404 });

    // Get gabarit
    let gabarit;
    if ((occ as any).aotGabaritId) {
      gabarit = await (prisma as any).gabarit.findUnique({
        where: { id: (occ as any).aotGabaritId }
      });
    }

    if (!gabarit) {
      gabarit = await (prisma as any).gabarit.findFirst({
        where: { isDefault: true }
      });
    }

    if (!gabarit) return NextResponse.json({ error: 'Aucun gabarit défini' }, { status: 500 });

    const { elements } = JSON.parse(gabarit.contenu);

    // 2. Replace variables function
    const replaceVars = (val: string, ligne?: any) => {
      if (!val) return val;
      let result = val;

      const tiersNom = occ.tiers?.nom || '';
      const nature = occ.tiers?.natureJuridique ? `${occ.tiers.natureJuridique} ` : '';
      const agissant = (occ as any).agissantPour ? `, agissant pour le compte de ${(occ as any).agissantPour}` : '';
      const demandeurComplet = `Vu la pétition par laquelle ${nature}${tiersNom}${agissant}, demande l'autorisation d'occuper le domaine public à Ivry-sur-Seine par :`;

      // Get main contact for contact variables
      const mainContact = occ.contacts?.[0] || occ.tiers?.contacts?.[0];

      const replacements: Record<string, string> = {
        // Dossier info
        '{id}': occ.id.toString(),
        '{nom}': occ.nom || '',
        '{adresse}': (occ.adresse || '').replace(/^(.*?)(\d{5}\s+.*)$/, '$1\n$2'),
        '{type}': occ.type || '',
        '{statut}': occ.statut || '',
        '{dateDebut}': occ.dateDebut ? format(new Date(occ.dateDebut), 'dd/MM/yyyy') : '',
        '{dateFin}': occ.dateFin ? format(new Date(occ.dateFin), 'dd/MM/yyyy') : '',
        '{anneeTaxation}': occ.anneeTaxation?.toString() || '',
        '{description}': occ.description || '',

        // Tiers info
        '{tiers.nom}': occ.tiers?.nom || '',
        '{tiers.siret}': occ.tiers?.siret || '',
        '{tiers.email}': occ.tiers?.email || '',
        '{tiers.adresse}': occ.tiers?.adresse || '',

        // Contact info
        '{demandeurComplet}': demandeurComplet,
        '{contact.nom}': mainContact?.nom || '',
        '{contact.prenom}': mainContact?.prenom || '',
        '{contact.email}': mainContact?.email || '',
        '{contact.telephone}': mainContact?.telephone || '',
        '{contact.role}': mainContact?.role || '',

        // Date
        '{today}': format(new Date(), 'dd MMMM yyyy', { locale: fr }),

        // Signatory
        '{signataireNom}': settings?.signataireNom || '',
        '{signataireRole}': settings?.signataireRole || '',
        '{signataireDelegation}': settings?.signataireDelegation || '',

        // Legacy
        '{agissantPour}': (occ as any).agissantPour || '',
      };

      // Handle article variables
      if (ligne && ligne.article) {
        replacements['{article.numero}'] = ligne.article.numero || '';
        replacements['{article.designation}'] = ligne.article.designation || '';
        replacements['{article.montant}'] = ligne.article.montant?.toString() || '0';
        replacements['{article.quantite}'] = (ligne.quantite1 || 0).toString();
        replacements['{article.quantite1}'] = (ligne.quantite1 || 0).toString();
        replacements['{article.quantite2}'] = (ligne.quantite2 || 0).toString();

        if (ligne.dateDebut && ligne.dateFin) {
          const d1 = new Date(ligne.dateDebut);
          const d2 = new Date(ligne.dateFin);
          replacements['{article.dateDebut}'] = format(d1, 'dd/MM/yyyy');
          replacements['{article.dateFin}'] = format(d2, 'dd/MM/yyyy');
          replacements['{article.dates}'] = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
        }

        replacements['{article.details}'] = `${ligne.quantite1 || 0} ${ligne.article.modeTaxation?.nom || 'unité(s)'}`;
        replacements['{article.note}'] = (ligne as any).note || '';
        const noteStr = (ligne as any).note ? `\n${(ligne as any).note}` : '';
        replacements['{article.designationcomplete}'] = `${ligne.article.designation || ''}${noteStr}`;
      }

      // Add numbered article variables (article1, article2, etc.)
      if (occ.lignes) {
        occ.lignes.forEach((ligne, idx) => {
          const num = idx + 1;
          const article = ligne.article;
          if (article) {
            replacements[`{article${num}.numero}`] = article.numero || '';
            replacements[`{article${num}.designation}`] = article.designation || '';
            replacements[`{article${num}.montant}`] = article.montant?.toString() || '0';
            replacements[`{article${num}.quantite1}`] = (ligne.quantite1 || 0).toString();
            replacements[`{article${num}.quantite2}`] = (ligne.quantite2 || 0).toString();

            if (ligne.dateDebut && ligne.dateFin) {
              const d1 = new Date(ligne.dateDebut);
              const d2 = new Date(ligne.dateFin);
              replacements[`{article${num}.dateDebut}`] = format(d1, 'dd/MM/yyyy');
              replacements[`{article${num}.dateFin}`] = format(d2, 'dd/MM/yyyy');
              replacements[`{article${num}.dates}`] = `${format(d1, 'dd/MM/yyyy')} - ${format(d2, 'dd/MM/yyyy')}`;
            }

            replacements[`{article${num}.details}`] = `${ligne.quantite1 || 0} ${article.modeTaxation?.nom || 'unité(s)'}`;
          }
        });
      }

      // Log replacements that were done
      let replacementsApplied = 0;
      Object.entries(replacements)
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([k, v]) => {
          if (result.includes(k)) {
            replacementsApplied++;
            console.log(`  [AOT DOCX REPLACE] ${k} => ${v.substring(0, 50)}`);
          }
          result = result.split(k).join(v);
        });

      if (replacementsApplied === 0 && val.includes('{')) {
        console.log(`  [AOT DOCX NO MATCH] Input had variables but none were replaced: ${val.substring(0, 100)}`);
      }

      return result;
    };

    // 3. Convert hex color to RGB for DOCX
    const hexToRgb = (hex: string): string => {
      const h = hex.replace('#', '');
      return h.length === 6 ? h : '000000';
    };

    // 4. Group elements by Y position to create zones
    const sortedElements = [...(elements as any[])].sort((a, b) => a.y - b.y);
    const paragraphs: Paragraph[] = [];
    let lastY = 0;

    for (const el of sortedElements) {
      const style = el.style || {};

      // Add spacing between zones based on Y difference
      const yDiff = el.y - lastY;
      if (yDiff > 30 && lastY > 0) {
        paragraphs.push(new Paragraph({ text: '' }));
      }
      lastY = el.y;

      const isRepeated = typeof el.value === 'string' && el.value.includes('{article.');
      const instances = isRepeated && occ.lignes ? occ.lignes : [null];

      for (const instance of instances) {
        if (el.type === 'TEXT' || el.type === 'VARIABLE') {
          const text = replaceVars(el.value, instance);
          if (text) {
            // Split by newlines to handle multiline text
            const lines = text.split('\n');

            for (const line of lines) {
              const runs = [
                new TextRun({
                  text: line || ' ',
                  size: ((style.fontSize || 12) * 2) as any,
                  color: hexToRgb(style.color || '#000000'),
                  bold: style.fontWeight === 'bold',
                  italic: style.fontStyle === 'italic',
                  underline: style.textDecoration === 'underline' ? { type: UnderlineType.SINGLE } : undefined,
                  font: style.fontFamily ? (style.fontFamily.includes('serif') ? 'Times New Roman' : 'Calibri') : 'Calibri',
                })
              ];

              const alignment =
                style.textAlign === 'center'
                  ? AlignmentType.CENTER
                  : style.textAlign === 'right'
                    ? AlignmentType.RIGHT
                    : AlignmentType.LEFT;

              paragraphs.push(
                new Paragraph({
                  children: runs,
                  alignment,
                  spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
                })
              );
            }
          }
        } else if (el.type === 'IMAGE' && el.value) {
          paragraphs.push(
            new Paragraph({
              text: `[Image: ${el.value}]`,
              italics: true,
              alignment: AlignmentType.CENTER,
            })
          );
        }
      }
    }

    // 5. Create document with margins matching A4
    const doc = new Document({
      sections: [
        {
          margins: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
          },
          children: paragraphs.length > 0 ? paragraphs : [new Paragraph('Aucun contenu')],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="AOT-${occ.id}.docx"`,
      },
    });
  } catch (err: any) {
    console.error('[AOT DOCX ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
