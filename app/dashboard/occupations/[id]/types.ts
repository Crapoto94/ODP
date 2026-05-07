export interface Tiers {
  id: number;
  nom: string;
  code_sedit?: string;
  email?: string;
  contacts?: Contact[];
}

export interface ModeTaxation {
  id: number;
  nom: string;
}

export interface Article {
  id: number;
  numero: string | null;
  designation: string;
  montant: number;
  modeTaxation?: ModeTaxation;
  meta?: any;
}

export interface LigneArticle {
  id: number;
  articleId: number;
  quantite1: number;
  quantite2: number;
  dateDebut: string;
  dateFin: string;
  dateDebutConstatee?: string;
  dateFinConstatee?: string;
  montant: number;
  photos?: string;
  note?: string;
  article?: Article;
}

export interface Contact {
  id: number;
  nom: string | null | undefined;
  prenom: string | null | undefined;
  email: string | null | undefined;
  telephone?: string | null | undefined;
  titre?: string | null | undefined;
  entreprise?: string | null | undefined;
  role: string | null | undefined;
  pjPath?: string | null | undefined;
}

export interface Note {
  id: number;
  author: string;
  content: string;
  created_at: string;
  pjPath?: string;
  pjName?: string;
}

export interface Occupation {
  id: number;
  nom: string;
  statut: string;
  type: string;
  montantCalcule: number;
  dateDebut: string;
  dateFin: string;
  anneeTaxation?: number;
  adresse: string;
  agissantPour?: string | null;
  agissantPourTier?: Tiers | null;
  latitude?: number;
  longitude?: number;
  observations?: string;
  datePaiement?: string | Date | null;
  tiers?: Tiers;
  lignes?: LigneArticle[];
  contacts?: Contact[];
  photos?: string;
  aotGabaritId?: number | null;
  aotFinalPath?: string;
  aotSigned?: boolean;
  facturePath?: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border?: string;
}

export interface TypeConfig {
  label: string;
  color: string;
  bg: string;
  border?: string;
}
