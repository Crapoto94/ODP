"use client";

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Calculator, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { TYPES_LIEU, EQUIPEMENTS } from '@/lib/tournage-simulation';

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const BAREME: Record<string, string> = { VOIRIE: 'Barème voirie 2026', BATIMENTS: 'Délibération bâtiments publics (13/02/2025)', SPORT: 'Tarifs équipements sportifs 2025/2026' };

// Simulation financière d'une demande d'après les barèmes de la Ville ; les paramètres ajustables sont enregistrés sur la demande.
export default function SimulationFinanciere({ demandeId }: { demandeId: number }) {
  const [data, setData] = useState<any>(null);
  const [surcharges, setSurcharges] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    setData(null);
    axios.get(`/api/tournages/demandes/${demandeId}/simulation`).then((r) => { setData(r.data); setSurcharges(r.data.surcharges || {}); })
      .catch((e) => setErreur(e.response?.data?.error || e.message));
  }, [demandeId]);
  useEffect(() => { charger(); }, [charger]);

  const recalculer = async (s = surcharges) => {
    setBusy(true); setErreur(null);
    try { const r = await axios.post(`/api/tournages/demandes/${demandeId}/simulation`, { surcharges: s }); setData(r.data); setSurcharges(r.data.surcharges || {}); }
    catch (e: any) { setErreur(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };
  const maj = (patch: any) => { const s = { ...surcharges, ...patch }; setSurcharges(s); recalculer(s); };

  if (erreur && !data) return <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{erreur}</section>;
  if (!data) return <section className="rounded-xl border border-slate-200 bg-white p-4"><Loader2 size={16} className="animate-spin text-slate-400" /></section>;
  const s = data.simulation;
  const sel = 'h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs';

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 flex items-center gap-2"><Calculator size={13} /> Simulation financière</h4>
        <span className="text-[11px] text-slate-400">{BAREME[s.bareme]} · {s.nbJours} jour(s) · {s.personnes} pers.</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-[11px] text-slate-500">Lieu
            <select className={`${sel} block mt-0.5`} value={surcharges.typeLieu || s.typeLieu} onChange={(e) => maj({ typeLieu: e.target.value })}>
              {TYPES_LIEU.map((t) => <option key={t.id} value={t.id}>{t.label.split(' (')[0]}</option>)}
            </select>
          </label>
          {s.typeLieu === 'SPORT' && (
            <label className="text-[11px] text-slate-500">Équipement
              <select className={`${sel} block mt-0.5`} value={surcharges.equipement || s.equipement || ''} onChange={(e) => maj({ equipement: e.target.value })}>
                <option value="">— choisir —</option>
                {EQUIPEMENTS.map((t) => <option key={t.id} value={t.id}>{t.label.split(',')[0].split(' (')[0]}</option>)}
              </select>
            </label>
          )}
          {(s.typeLieu === 'VOIE' || s.typeLieu === 'ESPACE_VERT') && (
            <>
              <label className="text-[11px] text-slate-500">Surface (m²)
                <input type="number" min={0} className={`${sel} block mt-0.5 w-24`} placeholder={String(s.surfaceM2 || '')} defaultValue={surcharges.surfaceM2 ?? ''} onBlur={(e) => { if (String(surcharges.surfaceM2 ?? '') !== e.target.value) maj({ surfaceM2: e.target.value }); }} />
              </label>
              <label className="text-[11px] text-slate-500">Câbles (m)
                <input type="number" min={0} className={`${sel} block mt-0.5 w-24`} placeholder={String(s.cablesM || '')} defaultValue={surcharges.cablesM ?? ''} onBlur={(e) => { if (String(surcharges.cablesM ?? '') !== e.target.value) maj({ cablesM: e.target.value }); }} />
              </label>
            </>
          )}
          <label className="text-[11px] text-slate-500">Abattement
            <select className={`${sel} block mt-0.5`} value={surcharges.abattement || 'AUTO'} onChange={(e) => maj({ abattement: e.target.value })}>
              <option value="AUTO">Automatique</option><option value="OUI">Forcer</option><option value="NON">Aucun</option>
            </select>
          </label>
          <label className="text-[11px] text-slate-500">Exonération
            <select className={`${sel} block mt-0.5`} value={surcharges.gratuit || 'AUTO'} onChange={(e) => maj({ gratuit: e.target.value })}>
              <option value="AUTO">Automatique</option><option value="OUI">Forcer</option><option value="NON">Aucune</option>
            </select>
          </label>
          {busy ? <Loader2 size={14} className="animate-spin text-slate-400 mb-2" /> : <button onClick={() => recalculer()} title="Recalculer" className="mb-1 w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"><RefreshCw size={13} /></button>}
        </div>

        {s.lignes.length === 0 ? <p className="text-sm text-slate-500">Aucune ligne chiffrée avec les informations actuelles.</p> : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-left text-slate-500"><th className="px-3 py-2">Désignation</th><th className="px-3 py-2 text-right">Qté</th><th className="px-3 py-2 text-right">Durée</th><th className="px-3 py-2 text-right">P.U.</th><th className="px-3 py-2 text-right">Montant</th></tr></thead>
              <tbody>
                {s.lignes.map((l: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2"><span className="font-semibold text-slate-800">{l.designation}</span>{l.detail && <span className="block text-[10px] text-slate-400">{l.detail}</span>}{!l.articleId && <span className="block text-[10px] text-amber-600">prix de repli (article absent des tarifs)</span>}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.quantite1}</td><td className="px-3 py-2 text-right tabular-nums">{l.quantite2}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">{eur(l.montantUnitaire)}</td><td className="px-3 py-2 text-right tabular-nums font-semibold">{eur(l.montant)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 text-xs">
                <tr><td colSpan={4} className="px-3 py-1.5 text-right text-slate-500">Sous-total</td><td className="px-3 py-1.5 text-right tabular-nums">{eur(s.sousTotal)}</td></tr>
                {s.abattement && <tr className="text-emerald-700"><td colSpan={4} className="px-3 py-1.5 text-right">Abattement {s.abattement.taux} % — {s.abattement.libelle}</td><td className="px-3 py-1.5 text-right tabular-nums">− {eur(s.abattement.montant)}</td></tr>}
                {s.gratuit && <tr className="text-emerald-700"><td colSpan={4} className="px-3 py-1.5 text-right">{s.gratuit.motif}</td><td className="px-3 py-1.5 text-right tabular-nums">− {eur(s.sousTotal)}</td></tr>}
                <tr className="bg-slate-50"><td colSpan={4} className="px-3 py-2 text-right font-black text-slate-900">Total estimé</td><td className="px-3 py-2 text-right tabular-nums font-black text-slate-900 text-sm">{eur(s.total)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
        {s.avertissements.map((a: string, i: number) => <p key={i} className="text-[11px] text-amber-700 flex gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> {a}</p>)}
        {erreur && <p className="text-xs text-rose-600">{erreur}</p>}
        <p className="text-[10px] text-slate-400">Estimation indicative (hypothèses réglables dans Paramètres › Gestion des tournages › Tarification). Les prix viennent du module Tarifs &amp; Articles.</p>
      </div>
    </section>
  );
}
