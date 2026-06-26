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
  businessType?: string; // e.g. CHANTIER, COMMERCE, TOURNAGE, TLPE
  year?: number; // Fiscal year of the dossier
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
  filename?: string;
}

export interface FilienLine {
  numero: number;
  imputation: string;
  montant: number;
  dateDebut?: Date;
  dateFin?: Date;
  year?: number;        // Exercice fiscal de cette ligne (surcharge le year du mouvement pour /503/ /504/)
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  label?: string;       // Libellé de la ligne
  category?: string;    // Catégorie de ventilation
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
    // Priority to movement year, fallback to global exercice, fallback to current year
    const year = mov.year || params.exercice || new Date().getFullYear();
    const bType = (mov.businessType || 'ODP').toLowerCase();
    const typeLabel = bType === 'tlpe' ? 'TLPE' : bType.charAt(0).toUpperCase() + bType.slice(1);
    
    // Formula: Variable + " - " + Type + " - " + Year
    const dynamicLabel = `ODP - ${typeLabel} - ${year}`;

    // En-tête du mouvement
    output += `/01/${mov.id}\n`;
    output += `/02/${mov.type}\n`;
    output += `/03/${mov.tiersCode}\n`;
    output += `/04/${dynamicLabel.slice(0, 40)}\n`;
    output += `/05/${mov.calendrier}\n`;
    output += `/06/${mov.monnaie}\n`;
    output += `/10/${mov.existant}\n`;
    output += `/11/${(mov.preBordereau || '800').toString()}\n`;
    output += `/12/${mov.poste || '0001'}\n`;
    output += `/13/${(mov.bordereau || '1').toString().padStart(5, '0').slice(0, 5)}\n`;
    output += `/20/${dynamicLabel.slice(0, 40)}\n`;
    
    // Tag /21/ : Specific for Chantiers
    const label21 = bType === 'chantier' ? `Chantier : ${mov.libelle.replace(/^Chantier\s+/, '')}` : mov.libelle;
    output += `/21/${label21.slice(0, 40)}\n`;
    
    // Attachments (up to 5)
    if (mov.attachments && mov.attachments.length > 0) {
      const sliced = mov.attachments.slice(0, 5);
      sliced.forEach((att, idx) => {
        const base = 26 + idx;
        const sub = base * 10;

        output += `/${base}/${att.name.slice(0, 40)}\n`;
        output += `/${sub + 1}/${(att.filename || att.name).slice(0, 100)}\n`;
        output += `/${sub + 2}/${att.supportType || '01'}\n`;
        output += `/${sub + 3}/${att.path.slice(0, 200)}\n`;
        // Add /294/011 on the last PJ (always Détails de facture)
        if (idx === sliced.length - 1) {
          output += `/294/011\n`;
        }
      });
    }
    output += `/44/N\n`;

    // Lines
    const fmtNum = (n: number) => n.toFixed(2).replace('.', ',');
    const totalMontant = mov.lines.reduce((sum, l) => sum + l.montant, 0);

    // Détails des prestations : un bloc /**/ /500/.../509/ par année (ligne).
    // Pour un regroupement pluri-annuel, on liste ici chaque exercice, mais on
    // ne génère ensuite qu'une seule ligne de mouvement /51/ (cf. ci-dessous).
    mov.lines.forEach((line, li) => {
      const ordre = (li + 1).toString().padStart(3, '0');
      output += `/**/\n`;
      output += `/500/P\n`;
      output += `/501/${ordre}\n`;

      const lineYear = line.year || year;

      // Tag 502 : libellé de la ligne si fourni, sinon défaut avec l'année de la ligne
      const label502 = line.label
        ? line.label
        : `Occup. Domaine Public - CF détail - ${lineYear}`;
      output += `/502/${label502.slice(0, 80)}\n`;
      output += `/503/0101${lineYear}\n`;
      output += `/504/3112${lineYear}\n`;
      output += `/505/1,00\n`;
      output += `/506/${fmtNum(line.montant)}\n`;
      output += `/509/${fmtNum(line.montant)}\n`;
    });

    // Une seule ligne de mouvement /51/ pour tout le titre : la ventilation
    // analytique provient de la première ligne (identique sur toutes les années),
    // et /66/ porte le montant total du mouvement.
    const ventil = mov.lines[0] || ({} as FilienLine);
    output += `/--/\n`;
    output += `/51/01\n`;

    const p1Atts = [
      (ventil.chapitre || params.filienChapitre || '').padEnd(10, ' ').slice(0, 10),
      (ventil.nature || params.filienNature || '').padEnd(10, ' ').slice(0, 10),
      (ventil.fonction || params.filienFonction || '').padEnd(10, ' ').slice(0, 10),
      (ventil.codeInterne || params.filienCodeInterne || '').padEnd(10, ' ').slice(0, 10),
      (ventil.typeMouvement || params.filienTypeMouvement || 'R').slice(0, 1),
      (ventil.sens || params.filienSens || (mov.type === 'R' ? 'R' : 'D')).slice(0, 1)
    ];
    output += `/541/${p1Atts.join('')}\n`;

    const p2Atts = [
      (ventil.structure || params.filienStructure || '').padEnd(10, ' ').slice(0, 10),
      (ventil.gestionnaire || params.filienGestionnaire || '').padEnd(10, ' ').slice(0, 10),
      ''.padEnd(10, ' ')
    ];
    output += `/542/${p2Atts.join('')}\n`;

    // Total du titre (une seule fois, après toutes les lignes)
    output += `/57/Total facture\n`;
    output += `/66/${fmtNum(totalMontant)}\n`;

    // Separator after each movement
    output += `/##/\n`;
  }

  return output;
}
