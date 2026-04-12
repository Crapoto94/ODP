export interface Element {
  id: string;
  type: 'TEXT' | 'RECT' | 'IMAGE' | 'VARIABLE';
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    color: string;
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    padding: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
    noBackground: boolean;
  };
  isArticleRepeated?: boolean;
  verticalPitch?: number;
}

export const mapFont = (fontFamily: string) => {
    if (!fontFamily) return 'roboto';
    const f = fontFamily.toLowerCase();
    
    if (f.includes('roboto') || f.includes('helvetica') || f.includes('arial') || f.includes('sans-serif')) return 'roboto';
    if (f.includes('times') || f.includes('serif')) return 'times';
    if (f.includes('courier') || f.includes('mono')) return 'courier';
    
    return 'roboto';
};

export interface Gabarit {
  id: number;
  nom: string;
  contenu: string;
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

export const VARIABLES = [
  { label: 'N° Dossier', value: '{id}' },
  { label: 'Nom Dossier', value: '{nom}' },
  { label: 'Nom Tiers', value: '{tiers.nom}' },
  { label: 'Demandeur Complet (AOT)', value: '{demandeurComplet}' },
  { label: 'Adresse', value: '{adresse}' },
  { label: 'Date Début', value: '{dateDebut}' },
  { label: 'Date Fin', value: '{dateFin}' },
  { label: 'Montant Total', value: '{totalHT}' },
  { label: 'Date du jour', value: '{today}' },
  { label: 'Numéro de Facture', value: '{numeroFacture}' },
  { label: 'Signataire Rôle', value: '{signataireRole}' },
  { label: 'Signataire Délégation', value: '{signataireDelegation}' },
  { label: 'Signataire Nom', value: '{signataireNom}' },
  { label: 'Période (Année)', value: '{periode}' },
  { label: 'Variable /12/', value: '{v12}' },
  { label: 'Variable /13/', value: '{v13}' },
  { label: 'Variable /20/', value: '{v20}' },
  { label: 'Ventilation /541/ (Chapitre)', value: '{v541.chapitre}' },
  { label: 'Ventilation /541/ (Nature)', value: '{v541.nature}' },
  { label: 'Ventilation /541/ (Fonction)', value: '{v541.fonction}' },
  { label: 'Ventilation /541/ (Code Interne)', value: '{v541.codeInterne}' },
  { label: 'Ventilation /541/ (Type Mvmt)', value: '{v541.typeMvmt}' },
  { label: 'Ventilation /541/ (Sens)', value: '{v541.sens}' },
  { label: 'Gestion /542/ (Structure)', value: '{v542.structure}' },
  { label: 'Gestion /542/ (Gestionnaire)', value: '{v542.gestionnaire}' },
  { label: 'Article: Désignation', value: '{article.designation}' },
  { label: 'Article: Note', value: '{article.note}' },
  { label: 'Article: Désignation Complète', value: '{article.designationcomplete}' },
  { label: 'Article: Quantité', value: '{article.quantite}' },
  { label: 'Article: Prix Unitaire', value: '{article.pu}' },
  { label: 'Article: Total HT', value: '{article.totalHT}' }
];

export const FONTS = [
  { label: 'Roboto (Standard & WYSIWYG)', value: '"Roboto", sans-serif' },
  { label: 'Serif (Classique)', value: '"Times New Roman", Times, serif' },
  { label: 'Monospace (Code)', value: 'Courier, monospace' }
];

export const MOCK_ARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  articleId: i + 1,
  designation: `Article de test #${i + 1} - ${i % 2 === 0 ? 'Occupation standard' : 'Redevance spéciale'}`,
  note: i % 3 === 0 ? `Piquetage zone B, secteur ${i}` : '',
  quantite: Math.floor(Math.random() * 10) + 1,
  pu: (Math.random() * 100 + 10).toFixed(2)
}));
