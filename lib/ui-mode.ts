import { cookies } from 'next/headers';

// Interface « v2 » (maquette Stitch / Ivry ODP Civic System) : embrayable / débrayable par TOUT utilisateur,
// contrairement au mode DEV de la base (réservé aux administrateurs). Préférence stockée dans un cookie du
// navigateur (et non dans la session) pour survivre à la déconnexion / reconnexion.
export const UI_COOKIE = 'odp_ui';
export type UiMode = 'classic' | 'v2';

export async function getUiMode(): Promise<UiMode> {
  const store = await cookies();
  return store.get(UI_COOKIE)?.value === 'v2' ? 'v2' : 'classic';
}
