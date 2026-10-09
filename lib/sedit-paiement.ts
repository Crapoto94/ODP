import axios from 'axios';
import { getApmSettings } from './apm';

// État de paiement des titres de recette SEDIT (lecture seule, via l'API centrale APM /oracle/query, type FINANCES).
// Même méthode que C:\dev\locatif (scripts/rapprocher-titres-sedit.js) ; documentée dans la skill « sedit-finances ».
export type EtatPaiement = 'paye' | 'a_payer' | 'non_pris_en_charge' | 'rejete' | 'suspendu';
export type ConfianceTitre = 'exact' | 'ambigu' | 'introuvable';

export interface FactureAVerifier {
  numero: string;
  codeSedit: string | null; // FI.TIERS.TIERS (numéro lisible du tiers)
  total: number; // euros TTC
  dateRef: Date; // date du train de facturation
}

export interface TitrePaiement {
  numero: string;
  confiance: ConfianceTitre;
  titreNumero?: number;
  titreDate?: string;
  bordereau?: string;
  etat?: EtatPaiement;
  priseEnChargeLe?: string | null;
  paiementLe?: string | null;
}

const esc = (s: string) => String(s).replace(/'/g, "''");

async function select(sql: string): Promise<any[]> {
  const { url, token } = await getApmSettings();
  const res = await axios.post(`${url}/oracle/query`, { type: 'FINANCES', sql }, { headers: { 'X-API-KEY': token }, timeout: 60000 });
  return Array.isArray(res.data) ? res.data : res.data?.rows || [];
}

export function etatPaiement(m: any): EtatPaiement {
  if (m.REJET === 'O' || m.MANDREJETE === 'O') return 'rejete';
  if (m.DP) return 'paye';
  if (m.SUSPENSION === 'O') return 'suspendu';
  return m.PEC ? 'a_payer' : 'non_pris_en_charge';
}

export async function lireEtatPaiement(factures: FactureAVerifier[]): Promise<TitrePaiement[]> {
  const out = new Map<string, TitrePaiement>();
  const cibles = factures.filter((f) => f.codeSedit);
  for (const f of factures) if (!f.codeSedit) out.set(f.numero, { numero: f.numero, confiance: 'introuvable' });

  // 1. code tiers lisible → ROO (MVTLIGNE.TIERS stocke le ROO)
  const codes = [...new Set(cibles.map((f) => f.codeSedit!))];
  const rooParCode = new Map<string, string>();
  for (let i = 0; i < codes.length; i += 500) {
    const liste = codes.slice(i, i + 500).map((c) => `'${esc(c)}'`).join(',');
    for (const t of await select(`SELECT TRIM(ROO_IMA_REF) AS ROO, TRIM(TIERS) AS CODE FROM FI.TIERS WHERE TRIM(TIERS) IN (${liste})`)) rooParCode.set(t.CODE, t.ROO);
  }
  const roos = [...new Set([...rooParCode.values()])];
  if (!roos.length) { for (const f of cibles) out.set(f.numero, { numero: f.numero, confiance: 'introuvable' }); return factures.map((f) => out.get(f.numero)!); }

  // 2. lignes de titres de recette de ces tiers, depuis la plus ancienne facture (marge 30 j)
  const depuis = new Date(Math.min(...cibles.map((f) => f.dateRef.getTime())) - 30 * 86400000).toISOString().slice(0, 10);
  const lignes: any[] = [];
  for (let i = 0; i < roos.length; i += 500) {
    const liste = roos.slice(i, i + 500).map((c) => `'${esc(c)}'`).join(',');
    lignes.push(...await select(
      `SELECT TRIM(l.TIERS) AS TIERS, l.MANDAT, TO_CHAR(l.DATMANDAT,'YYYY-MM-DD') AS DM, l.BORDEREAU, l.MONTANTTC_E AS MT
       FROM FI.MVTLIGNE l WHERE TRIM(l.TIERS) IN (${liste}) AND l.DATMANDAT >= DATE '${depuis}'`));
  }

  // 3. titres (sens R) : ROO + état de paiement, clé (n°, date) car la numérotation repart à 1 chaque exercice
  const titres = new Map<string, any>();
  const nums = [...new Set(lignes.map((l) => l.MANDAT))];
  for (let i = 0; i < nums.length; i += 500) {
    const liste = nums.slice(i, i + 500).join(',');
    for (const m of await select(
      `SELECT MANDAT, TO_CHAR(DATMANDAT,'YYYY-MM-DD') AS DM, TO_CHAR(DATE_PRISE_EN_CHARGE,'YYYY-MM-DD') AS PEC, TO_CHAR(DATE_PAIEMENT,'YYYY-MM-DD') AS DP, REJET, MANDREJETE, SUSPENSION
       FROM FI.MANDAT WHERE SENSMVT = 'R' AND DATMANDAT >= DATE '${depuis}' AND MANDAT IN (${liste})`)) titres.set(`${m.MANDAT}|${m.DM}`, m);
  }

  // 4. candidats : titre entier (lignes additionnées) ET ligne seule, montant TTC en EUROS
  const groupes = new Map<string, any>();
  for (const l of lignes) {
    const k = `${l.TIERS}|${l.MANDAT}|${l.DM}`;
    if (!titres.has(`${l.MANDAT}|${l.DM}`)) continue; // pas un titre de recette
    const g = groupes.get(k) || { tiers: l.TIERS, mandat: l.MANDAT, dm: l.DM, bord: l.BORDEREAU, total: 0, lignes: [] as number[] };
    g.total += Number(l.MT || 0); g.lignes.push(Number(l.MT || 0)); groupes.set(k, g);
  }
  for (const f of cibles) {
    const roo = rooParCode.get(f.codeSedit!);
    const dmin = f.dateRef.getTime() - 30 * 86400000;
    const ok = (g: any, mt: number) => g.tiers === roo && Math.abs(mt - f.total) < 0.011 && new Date(g.dm).getTime() >= dmin;
    let cand = [...groupes.values()].filter((g) => ok(g, g.total) || g.lignes.some((mt: number) => ok(g, mt)));
    const nonRejetes = cand.filter((g) => { const m = titres.get(`${g.mandat}|${g.dm}`); return m.REJET !== 'O' && m.MANDREJETE !== 'O'; });
    if (nonRejetes.length) cand = nonRejetes;
    if (cand.length === 0) out.set(f.numero, { numero: f.numero, confiance: 'introuvable' });
    else if (cand.length > 1) out.set(f.numero, { numero: f.numero, confiance: 'ambigu' });
    else {
      const g = cand[0]; const m = titres.get(`${g.mandat}|${g.dm}`);
      out.set(f.numero, { numero: f.numero, confiance: 'exact', titreNumero: g.mandat, titreDate: g.dm, bordereau: g.bord, etat: etatPaiement(m), priseEnChargeLe: m.PEC, paiementLe: m.DP });
    }
  }
  return factures.map((f) => out.get(f.numero)!);
}
