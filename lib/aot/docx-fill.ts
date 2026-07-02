import { format } from 'date-fns';

// Dynamic import for jszip (kept lazy to avoid loading it at module init)
let JSZip: any = null;

export const escapeXml = (str: string) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Gère les blocs conditionnels {IF variableName|texte conditionnel}.
 * Le texte n'apparaît que si la variable a une valeur non vide.
 */
export const processConditionals = (xml: string, variables: Record<string, string>): string => {
  let result = xml;
  const ifRegex = /\{IF\s+(\w+(?:\.\w+)*)\|/g;
  const matches: Array<{ index: number; length: number; variableKey: string; conditionalText: string }> = [];

  let match;
  while ((match = ifRegex.exec(xml)) !== null) {
    const startIndex = match.index;
    const variableKey = match[1];
    const textStartIndex = match.index + match[0].length;

    // Trouver le } fermant en comptant les accolades imbriquées
    let braceCount = 1;
    let endIndex = textStartIndex;
    while (endIndex < xml.length && braceCount > 0) {
      if (xml[endIndex] === '{') braceCount++;
      if (xml[endIndex] === '}') braceCount--;
      endIndex++;
    }

    const conditionalText = xml.substring(textStartIndex, endIndex - 1);
    matches.push({ index: startIndex, length: endIndex - startIndex, variableKey, conditionalText });
  }

  // Traiter en ordre inverse pour préserver les indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const variableValue = variables[`{${m.variableKey}}`];
    const replacement = variableValue && variableValue.trim() !== '' ? m.conditionalText : '';
    result = result.substring(0, m.index) + replacement + result.substring(m.index + m.length);
  }

  return result;
};

/**
 * Remplace les variables {clé} dans un DOCX (buffer). Gère les variables
 * fragmentées par Word et les blocs conditionnels {IF ...}.
 */
export const replaceVariablesInDocx = async (
  docxBuffer: Buffer,
  variables: Record<string, string>
): Promise<Buffer> => {
  if (!JSZip) {
    JSZip = (await import('jszip')).default;
  }
  const zip = new JSZip();
  await zip.loadAsync(docxBuffer);

  let documentXml = await zip.file('word/document.xml').async('text');

  // 1. Nettoyer les variables fragmentées par Word ({demandeurComplet} coupé par des <w:proofErr>)
  documentXml = documentXml.replace(/\{[^}]*?\}/g, (m: string) => m.replace(/<[^>]+>/g, ''));

  // 1.5 Blocs conditionnels
  documentXml = processConditionals(documentXml, variables);

  // 2. Remplacement (variables les plus longues d'abord pour éviter les collisions)
  let modifiedXml = documentXml;
  Object.entries(variables)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      modifiedXml = modifiedXml.replace(regex, escapeXml(value));
    });

  zip.file('word/document.xml', modifiedXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
};

export interface AotVariableOptions {
  /** Sous-ensemble de lignes couvertes par l'autorisation. Si absent, toutes les lignes du dossier. */
  lignes?: any[];
  /** Dates spécifiques à l'autorisation (sinon celles du dossier). */
  dateDebut?: Date | string | null;
  dateFin?: Date | string | null;
  /** Libellé de l'autorisation (remplace {nom}). */
  libelle?: string | null;
  /** Tiers "agissant pour" déjà résolu (optionnel). */
  agissantPourTier?: any;
}

/**
 * Construit le dictionnaire de variables pour un gabarit AOT.
 * Peut être restreint aux lignes/dates/libellé d'une autorisation précise.
 */
export function buildAotVariables(
  occ: any,
  settings: any,
  currentUser: { prenom: string; nom: string },
  opts: AotVariableOptions = {}
): Record<string, string> {
  const fmt = (d: Date | string | null | undefined) => (d ? format(new Date(d), 'dd/MM/yyyy') : '');

  const tiersNom = occ.tiers?.nom || '';
  const nature = occ.tiers?.natureJuridique ? `${occ.tiers.natureJuridique} ` : '';
  const agissant = occ.agissantPour ? `, agissant pour le compte de ${occ.agissantPour}` : '';
  const demandeurComplet = `Vu la pétition par laquelle ${nature}${tiersNom}${agissant}, demande l'autorisation d'occuper le domaine public à Ivry-sur-Seine par :`;

  const contactPrincipal = occ.tiers?.contacts?.find((c: any) => c.role === 'Contact principal');

  const dateDebut = opts.dateDebut !== undefined ? opts.dateDebut : occ.dateDebut;
  const dateFin = opts.dateFin !== undefined ? opts.dateFin : occ.dateFin;
  const libelle = opts.libelle || occ.nom || '';

  const variables: Record<string, string> = {
    '{id}': occ.id?.toString() || '',
    '{nom}': libelle,
    '{libelle}': libelle,
    '{autorisation.libelle}': libelle,
    '{tiers.nom}': occ.tiers?.nom || '',
    '{tiers.adresse}': occ.tiers?.adresse || '',
    '{demandeurComplet}': demandeurComplet,
    '{adresse}': occ.adresse || '',
    '{dateDebut}': fmt(dateDebut),
    '{dateFin}': fmt(dateFin),
    '{agissantPour}': occ.agissantPour || '',
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
    '{agissantPourTier.nom}': opts.agissantPourTier?.nom || '',
    '{agissantPourTier.adresse}': opts.agissantPourTier?.adresse || '',
  };

  const lignes = opts.lignes && opts.lignes.length > 0 ? opts.lignes : occ.lignes;
  if (lignes && lignes.length > 0) {
    lignes.forEach((ligne: any, idx: number) => {
      const i = idx + 1;
      variables[`{article${i}.designation}`] = ligne.article?.designation || '';
      variables[`{article${i}.quantite}`] = (ligne.quantite1 || 0).toString();
      variables[`{article${i}.pu}`] = (ligne.article?.montant || 0).toString();
      variables[`{article${i}.note}`] = ligne.note || '';
      if (ligne.dateDebut && ligne.dateFin) {
        variables[`{article${i}.dates}`] = `${fmt(ligne.dateDebut)} - ${fmt(ligne.dateFin)}`;
      } else {
        variables[`{article${i}.dates}`] = '';
      }
      variables[`{article${i}.details}`] = `${ligne.quantite1} ${ligne.article?.modeTaxation?.nom || 'unité(s)'}`;
    });
  }

  return variables;
}
