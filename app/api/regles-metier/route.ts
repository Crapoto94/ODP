import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermissionServer } from '@/lib/permissions-server';
import { PAR_CLE, resoudre, type ValeursRegles } from '@/lib/regles-metier';
import { chargerRegles, invaliderCacheRegles, lireSurcharges } from '@/lib/regles-metier-server';
import { lireConfigTournage } from '@/lib/tournage-service';
import { normaliserOptions, OPTIONS_PAR_DEFAUT } from '@/lib/tournage-simulation';

// Valeurs actuelles de toutes les règles (y compris les options de la simulation des tournages) + liste des règles modifiées
async function etat() {
  const surcharges = await lireSurcharges();
  const valeurs: ValeursRegles = resoudre(surcharges);
  const modifiees = new Set<string>(Object.keys(surcharges).filter((k) => PAR_CLE[k]));
  const cfg = await lireConfigTournage();
  const opts: any = normaliserOptions(cfg.simulation);
  for (const r of Object.values(PAR_CLE)) {
    if (r.stockage !== 'tournageSimulation' || !r.simCle) continue;
    valeurs[r.cle] = opts[r.simCle];
    if (JSON.stringify(opts[r.simCle]) !== JSON.stringify((OPTIONS_PAR_DEFAUT as any)[r.simCle])) modifiees.add(r.cle);
  }
  return { valeurs, modifiees: Array.from(modifiees) };
}

// Lecture : tout utilisateur connecté (le navigateur en a besoin pour ses calculs d'affichage)
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  try { return NextResponse.json(await etat()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// Modification : { cle, valeur } ou { cle, reset: true }. Réservé aux administrateurs (règles de tournage : aussi au droit « Paramétrage des tournages »).
export async function PUT(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  try {
    const { cle, valeur, reset } = await req.json();
    const regle = PAR_CLE[cle];
    if (!regle || regle.type === 'info') return NextResponse.json({ error: 'Règle inconnue ou non modifiable' }, { status: 400 });
    const admin = hasPermissionServer(s.role, 'MANAGE_USERS');
    const tournages = regle.domaine === 'TOURNAGE' && hasPermissionServer(s.role, 'MANAGE_TOURNAGES');
    if (!admin && !tournages) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const nouvelle = reset ? regle.defaut : valeur;
    // Validation par le catalogue : la valeur doit survivre à la résolution
    if (!reset && resoudre({ [cle]: nouvelle })[cle] !== nouvelle) return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 });

    if (regle.stockage === 'tournageSimulation' && regle.simCle) {
      const cfg = await lireConfigTournage();
      const opts = { ...normaliserOptions(cfg.simulation), [regle.simCle]: nouvelle };
      await (prisma as any).tournageConfig.update({ where: { id: 1 }, data: { simulation: opts } });
    } else if (reset) {
      await (prisma as any).regleMetier.deleteMany({ where: { cle } });
    } else {
      await (prisma as any).regleMetier.upsert({ where: { cle }, update: { valeur: nouvelle, modifiePar: `${s.prenom} ${s.nom}`.trim() }, create: { cle, valeur: nouvelle, modifiePar: `${s.prenom} ${s.nom}`.trim() } });
    }
    invaliderCacheRegles();
    await chargerRegles(true);
    return NextResponse.json(await etat());
  } catch (e: any) {
    console.error('[REGLES]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
