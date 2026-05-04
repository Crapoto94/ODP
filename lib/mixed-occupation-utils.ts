/**
 * Détecte si un dossier contient à la fois des articles TLPE et ODP (droits de voirie)
 * Un dossier TLPE qui contient des articles sans tlpeType est considéré comme mixte
 */
export function isMixedOccupation(occupation: any): boolean {
  if (!occupation.lignes || occupation.lignes.length === 0) {
    return false;
  }

  // Pour un dossier TLPE, vérifier s'il y a des articles non-TLPE (ODP)
  if (occupation.type === 'TLPE') {
    const hasOdpArticles = occupation.lignes.some((ligne: any) => {
      try {
        const meta = JSON.parse(ligne.article?.notes || '{}');
        // Si le tlpeType n'est pas présent, c'est un article ODP
        return !meta.tlpeType;
      } catch {
        // Si on ne peut pas parser, on considère que c'est un article ODP
        return true;
      }
    });

    const hasTlpeArticles = occupation.lignes.some((ligne: any) => {
      try {
        const meta = JSON.parse(ligne.article?.notes || '{}');
        return !!meta.tlpeType;
      } catch {
        return false;
      }
    });

    return hasOdpArticles && hasTlpeArticles;
  }

  // Pour les autres types, vérifier s'il y a des articles TLPE
  if (occupation.type === 'COMMERCE') {
    const hasTlpeArticles = occupation.lignes.some((ligne: any) => {
      try {
        const meta = JSON.parse(ligne.article?.notes || '{}');
        return !!meta.tlpeType;
      } catch {
        return false;
      }
    });

    return hasTlpeArticles;
  }

  return false;
}

/**
 * Retourne les types de dossier effectifs pour un dossier
 * Un dossier mixte est dans les deux catégories
 */
export function getOccupationTypes(occupation: any): string[] {
  const types = [occupation.type];

  if (isMixedOccupation(occupation)) {
    if (occupation.type === 'TLPE') {
      types.push('COMMERCE');
    } else if (occupation.type === 'COMMERCE') {
      types.push('TLPE');
    }
  }

  return types;
}
