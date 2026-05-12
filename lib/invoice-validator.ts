/**
 * Validateur pour vérifier la conformité des factures au cahier des charges
 * Cahier des charges: Cahier-des-charges-ASAP-ORMC-et-PJ-complementaireV5.pdf
 */

export interface ValidationError {
  type: 'margin' | 'color' | 'font' | 'transparency' | 'alignment' | 'format';
  severity: 'error' | 'warning';
  message: string;
  element?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// Marges techniques en points (1 mm = 2.834645669 points, 1 cm = 28.346)
const MARGINS = {
  left: 11.338,    // 4 mm
  right: 11.338,   // 4 mm
  top: 11.338,     // 4 mm
  bottom: 11.338,  // 4 mm
  rightAdditional: 28.346,      // 1 cm zone supplémentaire recto côté droit
  rightAdditionalHeight: 55.906, // 19.7 cm
  addressDebord: 8.504,          // 0.3 cm débord supplémentaire
  addressDebordHeight: 6.803     // 2.4 cm
};

// Dimensions A4 en points (210 x 297 mm)
const PAGE_WIDTH = 595.276;   // 210 mm
const PAGE_HEIGHT = 841.890;  // 297 mm

// Zone de sécurité = marges + zones réservées
const SAFE_AREA = {
  left: MARGINS.left,
  right: PAGE_WIDTH - MARGINS.right,
  top: MARGINS.top,
  bottom: PAGE_HEIGHT - MARGINS.bottom
};

// Polices autorisées
const ALLOWED_FONTS = ['Arial', 'Times', 'Courier', 'Helvetica', 'OCR-B'];

// Couleurs autorisées (niveau de gris uniquement)
const isValidGrayColor = (r: number, g: number, b: number): boolean => {
  return r === g && g === b; // Même valeur = gris
};

export function validateInvoiceElements(
  elements: any[],
  pageWidth: number = PAGE_WIDTH,
  pageHeight: number = PAGE_HEIGHT
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Vérifier les dimensions de la page
  if (Math.abs(pageWidth - PAGE_WIDTH) > 1 || Math.abs(pageHeight - PAGE_HEIGHT) > 1) {
    errors.push({
      type: 'format',
      severity: 'error',
      message: `Format de page incorrect. Attendu: 210 x 297 mm (${PAGE_WIDTH} x ${PAGE_HEIGHT} pt), Reçu: ${pageWidth} x ${pageHeight} pt`
    });
  }

  for (const el of elements) {
    const elementName = el.name || el.type || 'Element sans nom';

    // Vérifier les marges
    if (el.x < SAFE_AREA.left) {
      errors.push({
        type: 'margin',
        severity: 'error',
        message: `${elementName} dépasse la marge gauche. X: ${el.x.toFixed(2)} pt < ${SAFE_AREA.left.toFixed(2)} pt`,
        element: elementName,
        x: el.x,
        y: el.y
      });
    }

    if (el.x + (el.width || 0) > SAFE_AREA.right) {
      errors.push({
        type: 'margin',
        severity: 'error',
        message: `${elementName} dépasse la marge droite. X+Width: ${(el.x + (el.width || 0)).toFixed(2)} pt > ${SAFE_AREA.right.toFixed(2)} pt`,
        element: elementName,
        x: el.x,
        width: el.width
      });
    }

    if (el.y < SAFE_AREA.top) {
      errors.push({
        type: 'margin',
        severity: 'error',
        message: `${elementName} dépasse la marge supérieure. Y: ${el.y.toFixed(2)} pt < ${SAFE_AREA.top.toFixed(2)} pt`,
        element: elementName,
        x: el.x,
        y: el.y
      });
    }

    if (el.y + (el.height || 0) > SAFE_AREA.bottom) {
      errors.push({
        type: 'margin',
        severity: 'error',
        message: `${elementName} dépasse la marge inférieure. Y+Height: ${(el.y + (el.height || 0)).toFixed(2)} pt > ${SAFE_AREA.bottom.toFixed(2)} pt`,
        element: elementName,
        y: el.y,
        height: el.height
      });
    }

    // Vérifier les couleurs (doit être en niveaux de gris)
    if (el.style?.color) {
      const color = el.style.color;
      if (typeof color === 'string' && color !== '#000000' && color !== '#ffffff') {
        // Essayer de parser la couleur
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          if (!isValidGrayColor(r, g, b)) {
            errors.push({
              type: 'color',
              severity: 'error',
              message: `${elementName} utilise une couleur non conforme (couleur: ${color}). Requis: niveaux de gris uniquement`,
              element: elementName
            });
          }
        }
      }
    }

    if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== '#ffffff') {
      const bgColor = el.style.backgroundColor;
      if (bgColor.startsWith('#')) {
        const hex = bgColor.slice(1);
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        if (!isValidGrayColor(r, g, b)) {
          errors.push({
            type: 'color',
            severity: 'error',
            message: `${elementName} utilise une couleur de fond non conforme (couleur: ${bgColor}). Requis: niveaux de gris uniquement`,
            element: elementName
          });
        }
      }
    }

    // Vérifier la transparence
    if (el.style?.backgroundColor === 'transparent') {
      errors.push({
        type: 'transparency',
        severity: 'error',
        message: `${elementName} utilise la transparence. Pas autorisé en PDF/A`,
        element: elementName
      });
    }

    // Vérifier les polices
    if (el.style?.fontFamily) {
      const fontFamily = el.style.fontFamily;
      const hasValidFont = ALLOWED_FONTS.some(f => fontFamily.toLowerCase().includes(f.toLowerCase()));
      if (!hasValidFont) {
        errors.push({
          type: 'font',
          severity: 'warning',
          message: `${elementName} utilise une police potentiellement non conforme (${fontFamily}). Préféré: Arial, Times, Courier, Helvetica, OCR-B`,
          element: elementName
        });
      }
    }

    // Vérifier l'alignement dans les zones réservées
    // Zone réservée recto côté droit
    if (el.x >= PAGE_WIDTH - (MARGINS.rightAdditional + MARGINS.right) &&
        el.y < MARGINS.rightAdditionalHeight) {
      errors.push({
        type: 'alignment',
        severity: 'error',
        message: `${elementName} empiète sur la zone réservée recto côté droit (1cm x 19.7cm)`,
        element: elementName,
        x: el.x,
        y: el.y
      });
    }
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '✅ Aucune erreur détectée';
  }

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  let report = `⚠️ ${errorCount} erreur(s), ${warningCount} avertissement(s)\n\n`;

  const grouped = errors.reduce((acc, error) => {
    if (!acc[error.type]) acc[error.type] = [];
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  Object.entries(grouped).forEach(([type, typeErrors]) => {
    const typeLabel = {
      'margin': '📏 Marges',
      'color': '🎨 Couleurs',
      'font': '🔤 Polices',
      'transparency': '👻 Transparence',
      'alignment': '↗️ Alignement',
      'format': '📄 Format'
    }[type] || type;

    report += `${typeLabel}:\n`;
    typeErrors.forEach(error => {
      const severity = error.severity === 'error' ? '❌' : '⚠️';
      report += `  ${severity} ${error.message}\n`;
      if (error.x !== undefined) report += `     Position: (${error.x.toFixed(2)}, ${error.y?.toFixed(2) || 'N/A'})\n`;
    });
    report += '\n';
  });

  return report;
}
