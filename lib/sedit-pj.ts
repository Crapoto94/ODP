import { prisma } from './prisma';
import { select } from './sedit-paiement';

const SMB2 = require('smb2');

// Pièces jointes SEDIT (partage eGF/pjust) lues en SMB applicatif, sans montage OS : même mécanisme qu'AppDSI
// (finance-share.controller.js). Le compte est celui du dépôt FILIEN (AppSettings.filienUnc*), domaine IVRY pour seditgf-prod.
const BS = String.fromCharCode(92); // antislash
const RACINE = '//seditgf-prod/editions$/SMPROD/eGF/pjust';
const segments = (p: string) => p.split(BS).join('/').split('/').filter(Boolean);
const norm = (p: string) => segments(p).join('/').toLowerCase();
const esc = (s: string) => String(s).split("'").join("''");

export interface PieceSedit { buffer: Buffer; nom: string; mime: string }

// Le chemin vient d'Oracle (jamais du client) et doit rester sous la racine pjust.
export async function lirePieceTitre(titreRoo: string, nom: string): Promise<PieceSedit | null> {
  const rows = await select(
    `SELECT pj.NOM_PJ, pj.CHEMIN_FICHIER, pj.FORMAT FROM FI.FIPES_OBJ_PJ lnk JOIN FI.PJ_PES pj ON pj.ROO_IMA_REF = lnk.PJPES_ROO
     WHERE TRIM(lnk.OBJECT_ROO) = '${esc(titreRoo)}' AND pj.TYPE_PIECE_ID = 5 AND pj.NOM_PJ = '${esc(nom)}'`);
  const chemin = String(rows[0]?.CHEMIN_FICHIER || '').trim();
  if (!chemin) return null;
  const parts = segments(chemin); // serveur, partage, …
  if (!norm(chemin).startsWith(norm(RACINE) + '/') || parts.includes('..')) throw new Error('Chemin hors du partage SEDIT');

  const settings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
  if (!settings?.filienUncUser || !settings?.filienUncPass) throw new Error('Compte SMB non configuré (Paramétrage Filien)');
  const smb = new SMB2({ share: `${BS}${BS}${parts[0]}${BS}${parts[1]}`, domain: 'IVRY', username: settings.filienUncUser, password: settings.filienUncPass, autoCloseTimeout: 10000 });
  try {
    const data: Buffer = await new Promise((resolve, reject) => smb.readFile(parts.slice(2).join(BS), (e: any, d: any) => (e ? reject(e) : resolve(Buffer.isBuffer(d) ? d : Buffer.from(d)))));
    const ext = (chemin.split('.').pop() || '').toLowerCase().slice(0, 4) || (rows[0].FORMAT === '06' ? 'pdf' : '');
    const mime = ext === 'pdf' ? 'application/pdf' : ext === 'xml' ? 'application/xml' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
    return { buffer: data, nom: nom.toLowerCase().endsWith('.' + ext) ? nom : `${nom}.${ext}`, mime };
  } finally {
    try { smb.close(); } catch { /* déjà fermé */ }
  }
}
