import axios from 'axios';
import { getApmSettings, httpsAgent } from './apm';

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

export interface ReductionTitre {
  numero: number;
  date: string;
  roo: string;
  url: string;
  motif: string; // objet saisi par la comptabilité (ex. « erreur montant »)
  libelle: string; // ex. « REDUC.PIECE 1286 BORD. 189 »
  pieces: { nom: string; chemin: string }[]; // pièces jointes de type « Titre » (CA : certificat administratif)
}

export interface TitrePaiement {
  numero: string;
  confiance: ConfianceTitre;
  titreNumero?: number;
  titreDate?: string;
  bordereau?: string;
  titreRoo?: string | null; // identifiant technique (lien vers la fiche SEDIT)
  titreUrl?: string | null;
  etat?: EtatPaiement;
  priseEnChargeLe?: string | null;
  paiementLe?: string | null;
  montantReduit?: number; // réduction du titre (euros)
  annule?: boolean; // titre réduit en totalité
  reductions?: ReductionTitre[];
}

// Fiche du titre dans SEDIT, comme dans Gestion locative : <SEDIT_URL>/<page>?<param>=<ROO>.
export function urlTitre(roo: string): string {
  const base = (process.env.SEDIT_URL || 'https://seditgfprod.ivry.local/SeditGfSMProd').replace(/\/$/, '');
  return `${base}/${process.env.SEDIT_URL_MANDAT_PAGE || 'FicheMandat.html'}?${process.env.SEDIT_URL_MANDAT_PARAM || 'mandatId'}=${encodeURIComponent(roo)}`;
}

const esc = (s: string) => String(s).replace(/'/g, "''");

// La clé APM d'ODP (mail) doit avoir le droit /oracle/query ; sinon fournir une clé dédiée via APM_ORACLE_KEY.
export async function select(sql: string): Promise<any[]> {
  const { url, token } = await getApmSettings();
  const res = await axios.post(`${url}/oracle/query`, { type: 'FINANCES', sql }, { headers: { 'X-API-KEY': process.env.APM_ORACLE_KEY || token }, timeout: 60000, httpsAgent });
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

  // 2. lignes des titres de recette (sens R) de ces tiers : MVTLIGNE → MANDLIGNE → MANDAT.
  //    Le montant d'ORIGINE du titre est MANDLIGNE.MONTANTTC_E ; MVTLIGNE ne porte que le net après réduction.
  //    Une réduction est un titre à part (MANDAT.REDUCTION = 'O', MANORIGINE = ROO de l'original, autre numéro) : on l'écarte ;
  //    le titre d'origine porte le total réduit dans MANDLIGNE.MTTCREDUIT_E.
  const depuis = new Date(Math.min(...cibles.map((f) => f.dateRef.getTime())) - 30 * 86400000).toISOString().slice(0, 10);
  const rows: any[] = [];
  for (let i = 0; i < roos.length; i += 500) {
    const liste = roos.slice(i, i + 500).map((c) => `'${esc(c)}'`).join(',');
    rows.push(...await select(
      `SELECT TRIM(l.TIERS) AS TIERS, TRIM(m.ROO_IMA_REF) AS MROO, m.MANDAT, TO_CHAR(m.DATMANDAT,'YYYY-MM-DD') AS DM, m.BORDEREAU,
              ml.MONTANTTC_E AS MT, ml.MTTCREDUIT_E AS RED,
              TO_CHAR(m.DATE_PRISE_EN_CHARGE,'YYYY-MM-DD') AS PEC, TO_CHAR(m.DATE_PAIEMENT,'YYYY-MM-DD') AS DP, m.REJET, m.MANDREJETE, m.SUSPENSION
       FROM FI.MVTLIGNE l
       JOIN FI.MANDLIGNE ml ON TRIM(ml.MVTLIGNE) = TRIM(l.ROO_IMA_REF)
       JOIN FI.MANDAT m ON TRIM(m.ROO_IMA_REF) = TRIM(ml.MANDAT) AND m.SENSMVT = 'R' AND NVL(m.REDUCTION, 'N') <> 'O'
       WHERE TRIM(l.TIERS) IN (${liste}) AND m.DATMANDAT >= DATE '${depuis}'`));
  }

  // 3. regroupement par titre (ROO du MANDAT) : montants additionnés par tiers, et par ligne
  type Titre = { tiers: string; mroo: string; mandat: number; dm: string; bord: string; total: number; red: number; lignes: number[]; m: any };
  const titres = new Map<string, Titre>();
  for (const r of rows) {
    const k = `${r.TIERS}|${r.MROO}`;
    const t = titres.get(k) || { tiers: r.TIERS, mroo: r.MROO, mandat: r.MANDAT, dm: r.DM, bord: r.BORDEREAU, total: 0, red: 0, lignes: [] as number[], m: r };
    t.total += Number(r.MT || 0); t.red += Number(r.RED || 0); t.lignes.push(Number(r.MT || 0)); titres.set(k, t);
  }
  const originaux = [...titres.values()];

  // 4. candidats : montant d'origine du titre (total ou ligne) = total de la facture, en EUROS
  for (const f of cibles) {
    const roo = rooParCode.get(f.codeSedit!);
    const dmin = f.dateRef.getTime() - 30 * 86400000;
    const ok = (t: Titre, mt: number) => t.tiers === roo && Math.abs(mt - f.total) < 0.011 && new Date(t.dm).getTime() >= dmin;
    let cand = originaux.filter((t) => ok(t, t.total) || t.lignes.some((mt) => ok(t, mt)));
    const nonRejetes = cand.filter((t) => t.m.REJET !== 'O' && t.m.MANDREJETE !== 'O');
    if (nonRejetes.length) cand = nonRejetes;
    if (cand.length === 0) out.set(f.numero, { numero: f.numero, confiance: 'introuvable' });
    else if (cand.length > 1) out.set(f.numero, { numero: f.numero, confiance: 'ambigu' });
    else {
      const t = cand[0];
      out.set(f.numero, { numero: f.numero, confiance: 'exact', titreNumero: t.mandat, titreDate: t.dm, bordereau: t.bord, etat: etatPaiement(t.m), priseEnChargeLe: t.m.PEC, paiementLe: t.m.DP, titreRoo: t.mroo, titreUrl: urlTitre(t.mroo), montantReduit: t.red > 0 ? Math.round(t.red * 100) / 100 : 0, annule: t.red > 0 && Math.abs(t.red - t.total) < 0.011 });
    }
  }
  // 5. motif des réductions/annulations : titres de réduction (MANDAT.REDUCTION='O', MANORIGINE = ROO de l'original),
  //    objet (WO_MANDOBJET.LIBELLE, saisi par la comptabilité) et pièces jointes de type « Titre » (5) = CA
  const reduits = [...out.values()].filter((r) => r.titreRoo && r.montantReduit);
  const origines = [...new Set(reduits.map((r) => r.titreRoo!))];
  const parOrigine = new Map<string, ReductionTitre[]>();
  for (let i = 0; i < origines.length; i += 200) {
    const liste = origines.slice(i, i + 200).map((c) => `'${esc(c)}'`).join(',');
    const reds = await select(
      `SELECT TRIM(m.ROO_IMA_REF) AS ROO, TRIM(m.MANORIGINE) AS ORIG, m.MANDAT, TO_CHAR(m.DATMANDAT,'YYYY-MM-DD') AS DM
       FROM FI.MANDAT m WHERE m.REDUCTION = 'O' AND TRIM(m.MANORIGINE) IN (${liste})`);
    if (!reds.length) continue;
    const rl = reds.map((r) => `'${esc(r.ROO)}'`).join(',');
    const objets = await select(`SELECT TRIM(NS_SOURCE) AS S, LIBELLE FROM FI.WO_MANDOBJET WHERE TRIM(NS_SOURCE) IN (${rl})`);
    const pjs = await select(
      `SELECT TRIM(lnk.OBJECT_ROO) AS O, pj.NOM_PJ, pj.CHEMIN_FICHIER FROM FI.FIPES_OBJ_PJ lnk JOIN FI.PJ_PES pj ON pj.ROO_IMA_REF = lnk.PJPES_ROO
       WHERE TRIM(lnk.OBJECT_ROO) IN (${rl}) AND pj.TYPE_PIECE_ID = 5`);
    for (const r of reds) {
      const lib = objets.filter((o) => o.S === r.ROO).map((o) => String(o.LIBELLE || '').trim()).filter(Boolean);
      const libelle = lib.find((l) => /^(REDUC|ANNUL)/i.test(l)) || '';
      const motif = lib.filter((l) => l !== libelle).join(' — ') || libelle;
      const pieces = pjs.filter((p) => p.O === r.ROO).map((p) => ({ nom: String(p.NOM_PJ).trim(), chemin: String(p.CHEMIN_FICHIER || '').trim() }));
      parOrigine.set(r.ORIG, [...(parOrigine.get(r.ORIG) || []), { numero: r.MANDAT, date: r.DM, roo: r.ROO, url: urlTitre(r.ROO), motif, libelle, pieces }]);
    }
  }
  for (const r of reduits) r.reductions = parOrigine.get(r.titreRoo!) || [];
  return factures.map((f) => out.get(f.numero)!);
}
