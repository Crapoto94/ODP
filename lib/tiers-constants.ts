export const NATURE_JURIDIQUE_OPTIONS = [
  { code: "00", label: "00 - Non déterminé" },
  { code: "01", label: "01 - Particuliers" },
  { code: "02", label: "02 - Artisan / Commerçant / Profession libérale / Agriculteur" },
  { code: "03", label: "03 - Société" },
  { code: "04", label: "04 - CAM ou caisse appliquant les mêmes règles" },
  { code: "05", label: "05 - Caisse complémentaire" },
  { code: "06", label: "06 - Association" },
  { code: "07", label: "07 - Etat ou organisme d'Etat" },
  { code: "08", label: "08 - Etablissement public national" },
  { code: "09", label: "09 - Collectivité territoriale / EPL / EPS" },
  { code: "10", label: "10 - Etat étranger / ambassade" },
  { code: "11", label: "11 - CAF" }
];

export function getNatureJuridiqueLabel(code: string | null): string {
  if (!code) return "NON DÉFINI";
  const option = NATURE_JURIDIQUE_OPTIONS.find(opt => opt.code === code);
  return option ? option.label : code; // Fallback to code if not found (legacy data)
}
