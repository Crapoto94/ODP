import { join } from 'path';
import { existsSync } from 'fs';

// Pièces jointes des demandes de tournage (attestation d'assurance, plans…) : stockées HORS du dossier public,
// servies uniquement par /api/tournages/pieces/<ref>/<fichier> après contrôle des droits.
// En Docker : volume ./data monté sur /app/data (voir docker-compose.yml). Surchargeable par TOURNAGES_DIR.
export const dirTournages = () => process.env.TOURNAGES_DIR || join(process.cwd(), 'data', 'tournages');

export const RE_REF = /^TOU-[A-Z0-9]+-\d{4}$/;
export const RE_FICHIER = /^[a-f0-9-]{36}\.(pdf|png|jpg|jpeg)$/;

// Ancien emplacement (public/uploads/tournages) : conservé en lecture pour les demandes déjà déposées
export function cheminPiece(ref: string, fichier: string): string | null {
  if (!RE_REF.test(ref) || !RE_FICHIER.test(fichier)) return null;
  const candidats = [join(dirTournages(), ref, fichier), join(process.cwd(), 'public', 'uploads', 'tournages', ref, fichier)];
  return candidats.find((c) => existsSync(c)) || null;
}

export const urlPiece = (ref: string, fichier: string) => `/api/tournages/pieces/${ref}/${fichier}`;
