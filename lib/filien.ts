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
  lines: FilienLine[];
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
  output += `/##/\n`;
  output += `/PARAM/${params.orga}/${params.budget}/${params.exercice}/${params.avancement}/${params.rejetDispo ? 'O' : 'N'}/${params.rejetCA ? 'O' : 'N'}/${params.rejetMarche ? 'O' : 'N'}\n`;

  // 2. Movements
  for (const mov of movements) {
    output += `/##/\n`; // Movement separator with newline
    
    // En-tête du mouvement
    output += `/01/${mov.id}\n`;
    output += `/02/${mov.type}\n`;
    output += `/03/${mov.tiersCode}\n`;
    output += `/04/${mov.libelle}\n`;
    output += `/05/${mov.calendrier}\n`;
    output += `/06/${mov.monnaie}\n`;
    output += `/10/${mov.existant}\n`;
    output += `/11/${(mov.preBordereau || '01235').toString().padStart(5, '0')}\n`;
    output += `/12/${mov.poste || '0001'}\n`;
    output += `/13/${(mov.bordereau || '1').toString().padStart(5, '0').slice(0, 5)}\n`;
    output += `/20/${(mov.objet || mov.libelle || 'Occupation du domaine public').slice(0, 40)}\n`;
    
    // Lines
    for (const line of mov.lines) {
      if (mov.monnaie === 'E') {
        const fmtNum = (n: number) => n.toFixed(2).replace('.', ',');
        const fmtDate = (d?: Date) => d ? d.toISOString().split('T')[0].split('-').reverse().join('') : '';

        output += `/**/\n`;
        output += `/500/P\n`; // P for Period-based (allows qty/price)
        output += `/501/${line.numero.toString().padStart(3, '0')}\n`;
        output += `/502/${(line.description || mov.libelle).slice(0, 200)}\n`;
        output += `/503/${fmtDate(line.dateDebut || new Date())}\n`;
        if (line.dateFin) output += `/504/${fmtDate(line.dateFin)}\n`;
        output += `/505/${fmtNum(line.quantite || 1)}\n`;
        output += `/506/${fmtNum(line.prixUnitaire || line.montant)}\n`;
        output += `/509/${fmtNum(line.montant)}\n`;
      }

      output += `/--/\n`; // Line separator with newline
      output += `/51/${line.numero.toString().padStart(2, '0')}\n`;
      
      // Analytical Ventilation /541/ and /542/
      // /541/ : Chapitre(10) Nature(10) Fonction(10) Operation(10) Type(1) Sens(1) = 42 chars
      const p1Atts = [
        (line.chapitre || params.filienChapitre || '').padEnd(10, ' ').slice(0, 10),
        (line.nature || params.filienNature || '').padEnd(10, ' ').slice(0, 10),
        (line.fonction || params.filienFonction || '').padEnd(10, ' ').slice(0, 10),
        (line.codeInterne || params.filienCodeInterne || '').padEnd(10, ' ').slice(0, 10),
        (line.typeMouvement || params.filienTypeMouvement || 'R').slice(0, 1),
        (line.sens || params.filienSens || (mov.type === 'R' ? 'R' : 'D')).slice(0, 1)
      ];
      output += `/541/${p1Atts.join('')}\n`;

      // /542/ : Segmentation(10) Gestionnaire(10) Destinataire(10) = 30 chars
      const p2Atts = [
        (line.structure || params.filienStructure || '').padEnd(10, ' ').slice(0, 10),
        (line.gestionnaire || params.filienGestionnaire || '').padEnd(10, ' ').slice(0, 10),
        ''.padEnd(10, ' ') // Destinataire, not yet in schema but positions must be respected
      ];
      output += `/542/${p2Atts.join('')}\n`;
      
      const montantTag = mov.monnaie === 'E' ? '/66/' : '/56/';
      output += `${montantTag}${line.montant.toFixed(2).replace('.', ',')}\n`;
      
      if (line.dateDebut) {
        const d = line.dateDebut;
        const dateStr = `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
        output += `/58/${dateStr}\n`;
      }
      if (line.dateFin) {
        const d = line.dateFin;
        const dateStr = `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`;
        output += `/59/${dateStr}\n`;
      }
    }
  }

  // Final separator
  output += `/##/\n`;

  return output;
}
