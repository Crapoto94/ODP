import { format } from 'date-fns';

export interface FilienParams {
  orga: string;
  budget: string;
  exercice: number;
  avancement: string;
  rejetDispo: boolean;
  rejetCA: boolean;
  rejetMarche: boolean;
  filienMonnaie?: string;
  filienMouvementEx?: string;
  // Analytical Ventilation defaults
  filienChapitre?: string;
  filienNature?: string;
  filienFonction?: string;
  filienCodeInterne?: string;
  filienTypeMouvement?: string;
  filienSens?: string;
  filienStructure?: string;
  filienGestionnaire?: string;
}

export interface FilienMovement {
  id: string; // Used if not overridden by mouvementStart
  type: string;
  tiersCode: string;
  libelle: string;
  calendrier: string;
  monnaie: string; // /06/
  existant: string; // /10/
  preBordereau?: string; // /11/
  poste?: string; // /12/
  bordereau?: string; // /13/
  objet?: string; // /20/
  attachments?: FilienAttachment[];
  lines: FilienLine[];
}

export interface FilienAttachment {
  name: string;
  supportType: string; // "01" (Electronic), "02" (Paper), etc.
  path: string; // UNC path or URL
  typePiece?: string; // e.g. "002"
  format?: string; // e.g. "PDF"
  docType?: string; // e.g. "MDT"
}

export interface FilienLine {
  numero: number;
  imputation: string;
  montant: number;
  dateDebut?: Date;
  dateFin?: Date;
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  // Analytical Ventilation
  chapitre?: string;
  nature?: string;
  fonction?: string;
  codeInterne?: string;
  typeMouvement?: string;
  sens?: string;
  structure?: string;
  gestionnaire?: string;
}

export function generateFilienFile(params: FilienParams, movements: FilienMovement[]): string {
  let output = '';

  // 1. Header
  output += `/##/PARAM/${params.orga}/${params.budget}/${params.exercice}/${params.avancement}/${params.rejetDispo ? 'O' : 'N'}/${params.rejetCA ? 'O' : 'N'}/${params.rejetMarche ? 'O' : 'N'}\n`;

  // 2. Movements
  for (const mov of movements) {
    // En-tête du mouvement
    output += `/01/${mov.id}\n`;
    output += `/02/${mov.type}\n`;
    output += `/03/${mov.tiersCode}\n`;
    output += `/04/${(mov.objet || mov.libelle || 'Occupation du domaine public').slice(0, 40)}\n`;
    output += `/05/${mov.calendrier}\n`;
    output += `/06/${mov.monnaie}\n`;
    output += `/10/${mov.existant}\n`;
    output += `/11/${(mov.preBordereau || '01235').toString().padStart(5, '0')}\n`;
    output += `/12/${mov.poste || '0001'}\n`;
    output += `/13/${(mov.bordereau || '1').toString().padStart(5, '0').slice(0, 5)}\n`;
    output += `/20/${mov.libelle.slice(0, 40)}\n`;
    
    // Attachments (up to 5)
    if (mov.attachments && mov.attachments.length > 0) {
      mov.attachments.slice(0, 5).forEach((att, idx) => {
        const base = 26 + idx;
        const sub = base * 10;
        
        output += `/${base}/${att.name.slice(0, 40)}\n`;
        output += `/${sub + 1}/${(att.filename || att.name).slice(0, 100)}\n`;
        output += `/${sub + 2}/${att.supportType || '01'}\n`;
        output += `/${sub + 3}/${att.path.slice(0, 200)}\n`;
      });
    }
    output += `/44/N\n`;

    // Lines
    for (const line of mov.lines) {
      const fmtNum = (n: number) => n.toFixed(2).replace('.', ',');
      const year = params.exercice || new Date().getFullYear();
      output += `/**/\n`;
      output += `/500/P\n`;
      output += `/501/001\n`;
      output += `/502/Montant total\n`;
      output += `/503/0101${year}\n`;
      output += `/504/3112${year}\n`;
      output += `/505/1,00\n`;
      output += `/506/${fmtNum(line.montant)}\n`;
      output += `/509/${fmtNum(line.montant)}\n`;

      output += `/--/\n`;
      output += `/51/01\n`;
      
      const p1Atts = [
        (line.chapitre || params.filienChapitre || '').padEnd(10, ' ').slice(0, 10),
        (line.nature || params.filienNature || '').padEnd(10, ' ').slice(0, 10),
        (line.fonction || params.filienFonction || '').padEnd(10, ' ').slice(0, 10),
        (line.codeInterne || params.filienCodeInterne || '').padEnd(10, ' ').slice(0, 10),
        (line.typeMouvement || params.filienTypeMouvement || 'R').slice(0, 1),
        (line.sens || params.filienSens || (mov.type === 'R' ? 'R' : 'D')).slice(0, 1)
      ];
      output += `/541/${p1Atts.join('')}\n`;

      const p2Atts = [
        (line.structure || params.filienStructure || '').padEnd(10, ' ').slice(0, 10),
        (line.gestionnaire || params.filienGestionnaire || '').padEnd(10, ' ').slice(0, 10),
        ''.padEnd(10, ' ')
      ];
      output += `/542/${p2Atts.join('')}\n`;
      
      output += `/57/Voir détail de facture\n`;
      output += `/66/${fmtNum(line.montant)}\n`;
    }
  }

  // Final separator
  output += `/##/\n`;

  return output;
}
