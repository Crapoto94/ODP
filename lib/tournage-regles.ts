// Règles de délai des demandes de tournage (partagées entre l'API publique, la validation serveur et l'administration).

export interface PeriodeAbsence {
  debut: string;   // AAAA-MM-JJ : première date de réception non traitée
  fin: string;     // AAAA-MM-JJ : dernière date de réception non traitée
  reprise: string; // AAAA-MM-JJ : à partir de cette date les tournages peuvent être acceptés
  motif?: string;
}

export interface ConfigRegles {
  delaiInstruction: number;       // 15
  typeJours: 'OUVRES' | 'CALENDAIRES';
  exclureFeries: boolean;
  delaiMinimalDepot: number;      // jours d'avance supplémentaires
  periodesAbsence: PeriodeAbsence[];
}

export const CONFIG_PAR_DEFAUT: ConfigRegles = {
  delaiInstruction: 15,
  typeJours: 'OUVRES',
  exclureFeries: true,
  delaiMinimalDepot: 0,
  periodesAbsence: [],
};

// ---- Dates (en jours calendaires, heure locale ignorée) ----
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const debutJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const plusJours = (d: Date, n: number) => { const r = debutJour(d); r.setDate(r.getDate() + n); return r; };

// Jours fériés français (fixes + mobiles calculés à partir de Pâques)
export function joursFeries(annee: number): Set<string> {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31), jour = ((h + l - 7 * m + 114) % 31) + 1;
  const paques = new Date(annee, mois - 1, jour);
  const fixes = [[1, 1], [5, 1], [5, 8], [7, 14], [8, 15], [11, 1], [11, 11], [12, 25]].map(([mm, dd]) => new Date(annee, mm - 1, dd));
  const mobiles = [1, 39, 50].map((n) => plusJours(paques, n)); // lundi de Pâques, Ascension, lundi de Pentecôte
  return new Set([...fixes, ...mobiles].map(iso));
}

export function estJourOuvre(d: Date, exclureFeries: boolean): boolean {
  const j = d.getDay();
  if (j === 0 || j === 6) return false; // lundi → vendredi
  return !(exclureFeries && joursFeries(d.getFullYear()).has(iso(d)));
}

// Ajoute n jours (ouvrés lundi-vendredi ou calendaires) à partir de la date de réception
export function ajouterJours(depart: Date, n: number, cfg: Pick<ConfigRegles, 'typeJours' | 'exclureFeries'>): Date {
  if (cfg.typeJours === 'CALENDAIRES') return plusJours(depart, n);
  let d = debutJour(depart);
  let reste = n;
  while (reste > 0) {
    d = plusJours(d, 1);
    if (estJourOuvre(d, cfg.exclureFeries)) reste--;
  }
  return d;
}

// Période d'absence couvrant une date de réception
export function periodeAbsenceDu(reception: Date, periodes: PeriodeAbsence[]): PeriodeAbsence | null {
  const r = iso(reception);
  return periodes.find((p) => p.debut && p.fin && r >= p.debut && r <= p.fin) || null;
}

// Première date de tournage acceptable pour une demande complète reçue à la date donnée
export function premiereDatePossible(reception: Date, cfg: ConfigRegles): { date: Date; periode: PeriodeAbsence | null } {
  const periode = periodeAbsenceDu(reception, cfg.periodesAbsence || []);
  let date = ajouterJours(reception, cfg.delaiInstruction, cfg);
  if (cfg.delaiMinimalDepot > 0) date = plusJours(date, cfg.delaiMinimalDepot);
  if (periode?.reprise) {
    const reprise = parseIso(periode.reprise);
    if (reprise > date) date = reprise;
  }
  return { date, periode };
}

// Date limite de réponse (fin du délai d'instruction)
export function dateLimiteReponse(reception: Date, cfg: ConfigRegles): Date {
  const periode = periodeAbsenceDu(reception, cfg.periodesAbsence || []);
  const depart = periode?.reprise ? parseIso(periode.reprise) : reception;
  return ajouterJours(depart, cfg.delaiInstruction, cfg);
}

export function normaliserConfig(row: any): ConfigRegles {
  if (!row) return { ...CONFIG_PAR_DEFAUT };
  return {
    delaiInstruction: Number(row.delaiInstruction ?? 15),
    typeJours: row.typeJours === 'CALENDAIRES' ? 'CALENDAIRES' : 'OUVRES',
    exclureFeries: row.exclureFeries !== false,
    delaiMinimalDepot: Number(row.delaiMinimalDepot ?? 0),
    periodesAbsence: Array.isArray(row.periodesAbsence) ? row.periodesAbsence : [],
  };
}

export const STATUTS_DEMANDE: Record<string, { label: string; cls: string }> = {
  NOUVELLE: { label: 'Nouvelle', cls: 'bg-blue-50 text-blue-700' },
  EN_INSTRUCTION: { label: 'En instruction', cls: 'bg-amber-50 text-amber-700' },
  COMPLEMENT: { label: 'Complément demandé', cls: 'bg-orange-50 text-orange-700' },
  ACCORD: { label: 'Accord de principe', cls: 'bg-emerald-50 text-emerald-700' },
  REFUSEE: { label: 'Refusée', cls: 'bg-rose-50 text-rose-700' },
  ANNULEE: { label: 'Annulée', cls: 'bg-slate-100 text-slate-600' },
};

export const STATUTS_AVIS: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'Pas de retour', cls: 'bg-amber-50 text-amber-700' },
  FAVORABLE: { label: 'Favorable', cls: 'bg-emerald-50 text-emerald-700' },
  DEFAVORABLE: { label: 'Défavorable', cls: 'bg-rose-50 text-rose-700' },
  ANNULE: { label: 'Annulé', cls: 'bg-slate-100 text-slate-500' },
};
