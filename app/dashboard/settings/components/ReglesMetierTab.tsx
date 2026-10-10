"use client";

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Scale, Search, RotateCcw, Info, Loader2, SlidersHorizontal } from 'lucide-react';
import { SCard, SInput, SSelect, SToggle, SBadge, SAlert, SLoading, SButton } from '@/components/v2/settings/ui';
import { CATALOGUE, DOMAINES, setReglesActives, type Domaine, type Regle } from '@/lib/regles-metier';
import { hasPermission } from '@/lib/permissions';

// Règles métier de facturation : toutes affichées, chacune débrayable (interrupteur) ou paramétrable (valeur / choix).
export default function ReglesMetierTab() {
  const [valeurs, setValeurs] = useState<Record<string, any> | null>(null);
  const [modifiees, setModifiees] = useState<Set<string>>(new Set());
  const [domaine, setDomaine] = useState<Domaine>('TLPE');
  const [recherche, setRecherche] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const appliquer = (d: any) => { setValeurs(d.valeurs); setModifiees(new Set(d.modifiees)); setReglesActives(d.valeurs); };
  useEffect(() => {
    axios.get('/api/regles-metier').then((r) => appliquer(r.data)).catch((e) => setMessage({ type: 'error', text: e.response?.data?.error || e.message }));
    axios.get('/api/auth/me').then((r) => setRole(r.data?.role || null)).catch(() => {});
  }, []);

  const admin = !!role && hasPermission(role, 'MANAGE_USERS');
  const domainesVisibles = DOMAINES.filter((d) => admin || d.id === 'TOURNAGE');
  useEffect(() => { if (role && !admin) setDomaine('TOURNAGE'); }, [role, admin]);

  const enregistrer = async (r: Regle, corps: { valeur?: any; reset?: boolean }) => {
    setBusy(r.cle); setMessage(null);
    try {
      const res = await axios.put('/api/regles-metier', { cle: r.cle, ...corps });
      appliquer(res.data);
      setMessage({ type: 'success', text: corps.reset ? `« ${r.titre} » : valeur par défaut rétablie.` : `« ${r.titre} » enregistrée. Appliquée dès le prochain calcul.` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || e.message });
    } finally { setBusy(null); }
  };

  const regles = useMemo(() => CATALOGUE.filter((r) => r.domaine === domaine && (!recherche.trim() || `${r.titre} ${r.description} ${r.groupe}`.toLowerCase().includes(recherche.trim().toLowerCase()))), [domaine, recherche]);
  const groupes = useMemo(() => Array.from(new Set(regles.map((r) => r.groupe))), [regles]);
  const nbModifiees = (d: Domaine) => CATALOGUE.filter((r) => r.domaine === d && modifiees.has(r.cle)).length;
  const libelleDefaut = (r: Regle) => r.type === 'switch' ? (r.defaut ? 'activée' : 'désactivée') : r.type === 'choix' ? (r.choix?.find((c) => c.valeur === r.defaut)?.libelle || String(r.defaut)) : `${r.defaut}${r.unite ? ' ' + r.unite : ''}`;

  if (!valeurs) return message ? <SAlert type="error">{message.text}</SAlert> : <SLoading />;
  const dom = DOMAINES.find((d) => d.id === domaine)!;

  return (
    <div className="space-y-6 max-w-5xl">
      <SAlert type="info">
        Ces règles pilotent le calcul des montants, des factures et des statuts. Chaque règle est <b>débrayable</b> (interrupteur) ou <b>paramétrable</b> (valeur, choix). Une modification s&apos;applique aux prochains calculs ; les montants déjà enregistrés des dossiers sont recalculés à leur prochaine modification.
      </SAlert>

      <div className="flex flex-wrap items-center gap-2">
        {domainesVisibles.map((d) => {
          const n = nbModifiees(d.id); const on = d.id === domaine;
          return (
            <button key={d.id} onClick={() => setDomaine(d.id)} className={`px-4 h-10 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-colors ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-[#e2e8f0] hover:bg-slate-50'}`}>
              {d.label}
              {n > 0 && <span className={`px-1.5 rounded-md text-[11px] ${on ? 'bg-white/25' : 'bg-amber-100 text-amber-700'}`}>{n} modifiée{n > 1 ? 's' : ''}</span>}
            </button>
          );
        })}
        <div className="flex-1 min-w-[200px] md:max-w-xs ml-auto"><SInput icon={Search} type="text" placeholder="Rechercher une règle…" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></div>
      </div>

      <p className="text-sm text-slate-600 -mt-2">{dom.description}</p>
      {message && <SAlert type={message.type}>{message.text}</SAlert>}

      {groupes.length === 0 && <p className="text-sm text-slate-500">Aucune règle ne correspond à la recherche.</p>}
      {groupes.map((g) => (
        <SCard key={g} icon={g === 'Principe' ? Info : SlidersHorizontal} title={g}>
          <div className="divide-y divide-slate-100 -my-2">
            {regles.filter((r) => r.groupe === g).map((r) => {
              const v = valeurs[r.cle]; const modif = modifiees.has(r.cle); const occupe = busy === r.cle;
              return (
                <div key={r.cle} className="py-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-x-8 gap-y-3 items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-bold text-slate-900">{r.titre}</h4>
                      {r.type === 'info' ? <SBadge tone="slate">Principe</SBadge> : modif ? <SBadge tone="amber">Modifiée</SBadge> : <SBadge tone="emerald">Valeur par défaut</SBadge>}
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-snug">{r.description}</p>
                    {(r.source || r.effet) && <p className="text-[11px] text-slate-400 mt-1">{r.source ? `Source : ${r.source}` : ''}{r.source && r.effet ? ' · ' : ''}{r.effet ? `Effet : ${r.effet}` : ''}</p>}
                  </div>

                  {r.type !== 'info' && (
                    <div className="flex flex-col gap-2 md:items-end">
                      {r.type === 'switch' && (
                        <SToggle checked={!!v} disabled={occupe} onChange={(x) => enregistrer(r, { valeur: x })} label={v ? 'Règle activée' : 'Règle désactivée'} />
                      )}
                      {r.type === 'nombre' && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <SInput type="number" key={`${r.cle}-${v}`} min={r.min} max={r.max} step={r.pas ?? 1} defaultValue={v} disabled={occupe}
                            onBlur={(e) => { const n = Number(e.target.value); if (e.target.value !== '' && n !== v) enregistrer(r, { valeur: n }); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} className="w-28 text-right" />
                          <span className="text-sm text-slate-500 w-12">{r.unite}</span>
                        </div>
                      )}
                      {r.type === 'choix' && (
                        <SSelect value={String(v)} disabled={occupe} onChange={(e) => enregistrer(r, { valeur: e.target.value })}>
                          {r.choix?.map((c) => <option key={c.valeur} value={c.valeur}>{c.libelle}</option>)}
                        </SSelect>
                      )}
                      {modif && (
                        <button onClick={() => enregistrer(r, { reset: true })} disabled={occupe} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">
                          {occupe ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Rétablir le défaut ({libelleDefaut(r)})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SCard>
      ))}
      {admin && nbModifiees(domaine) > 0 && (
        <div className="flex justify-end">
          <SButton variant="danger" icon={RotateCcw} onClick={async () => { if (!confirm(`Rétablir toutes les règles de « ${dom.label} » à leur valeur par défaut ?`)) return; for (const r of CATALOGUE.filter((x) => x.domaine === domaine && modifiees.has(x.cle))) await enregistrer(r, { reset: true }); }}>Tout rétablir pour {dom.label}</SButton>
        </div>
      )}
      <Scale className="hidden" />
    </div>
  );
}
