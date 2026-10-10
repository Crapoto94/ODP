"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FolderPlus, ExternalLink, Loader2, X } from 'lucide-react';

// Lien demande → dossier de tournage ODP : crée le dossier (tiers existant ou nouveau), qui alimente ensuite AOT et facturation
export default function DossierLien({ demande, onChange }: { demande: any; onChange?: () => void }) {
  const [info, setInfo] = useState<any>(null);
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<string>('NOUVEAU');
  const [busy, setBusy] = useState(false);
  const [creerLignes, setCreerLignes] = useState(true);
  const [simTotal, setSimTotal] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = () => axios.get(`/api/tournages/demandes/${demande.id}/dossier`).then((r) => { setInfo(r.data); if (r.data.candidats?.length) setChoix(String(r.data.candidats[0].id)); }).catch(() => setInfo({ dossier: null, candidats: [] }));
  useEffect(() => { axios.get(`/api/tournages/demandes/${demande.id}/simulation`).then((r) => setSimTotal(r.data.simulation?.total ?? null)).catch(() => {}); }, [demande.id, ouvert]);
  useEffect(() => { setInfo(null); charger(); /* eslint-disable-next-line */ }, [demande.id, demande.occupationId]);

  const creer = async () => {
    setBusy(true); setErreur(null);
    try {
      await axios.post(`/api/tournages/demandes/${demande.id}/dossier`, { ...(choix === 'NOUVEAU' ? { creerTiers: true } : { tiersId: Number(choix) }), creerLignes });
      setOuvert(false); await charger(); onChange?.();
    } catch (e: any) { setErreur(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <h4 className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Dossier de tournage ODP</h4>
      <div className="p-4 text-sm">
        {info === null ? <Loader2 size={16} className="animate-spin text-slate-400" /> : info.dossier ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-700">Dossier <b>#{info.dossier.id}</b> — {info.dossier.tiers?.nom} · statut <b>{info.dossier.statut}</b></p>
            <Link href={`/dashboard/occupations/${info.dossier.id}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"><ExternalLink size={13} /> Ouvrir le dossier</Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-500">Aucun dossier lié. Créez-le une fois la demande instruite : dates, lieu, contact et avis des services sont repris.</p>
            <button onClick={() => setOuvert(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"><FolderPlus size={13} /> Créer le dossier</button>
          </div>
        )}
      </div>

      {ouvert && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setOuvert(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900">Créer le dossier de tournage</h3>
              <button onClick={() => setOuvert(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
            </header>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Redevable (tiers) du dossier « {demande.titre} » :</p>
              <div className="space-y-2">
                {(info?.candidats || []).map((t: any) => (
                  <label key={t.id} className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer ${choix === String(t.id) ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}>
                    <input type="radio" className="mt-1" checked={choix === String(t.id)} onChange={() => setChoix(String(t.id))} />
                    <span className="text-sm"><b>{t.nom}</b>{t.code_sedit ? <span className="text-slate-400"> · SEDIT {t.code_sedit}</span> : null}<span className="block text-xs text-slate-500">{t.email || 'pas d\'e-mail'} · {t.adresse || 'pas d\'adresse'} · {t.statut}</span></span>
                  </label>
                ))}
                <label className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer ${choix === 'NOUVEAU' ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}>
                  <input type="radio" className="mt-1" checked={choix === 'NOUVEAU'} onChange={() => setChoix('NOUVEAU')} />
                  <span className="text-sm"><b>Créer un nouveau tiers « {demande.societe} »</b><span className="block text-xs text-slate-500">Tiers provisoire : à compléter (SIRET, code SEDIT) dans Gestion des tiers avant facturation.</span></span>
                </label>
              </div>
              <label className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm cursor-pointer">
                <input type="checkbox" className="mt-1" checked={creerLignes} onChange={(e) => setCreerLignes(e.target.checked)} />
                <span><b>Créer les lignes de facturation</b> depuis la simulation financière{simTotal != null ? <> (total estimé <b>{simTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</b>)</> : null}.<span className="block text-xs text-slate-500">Articles du module Tarifs, abattements et exonérations appliqués ; à contrôler dans le dossier avant facturation.</span></span>
              </label>
              {erreur && <p className="text-sm text-rose-600 font-semibold">{erreur}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setOuvert(false)} className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Annuler</button>
                <button disabled={busy} onClick={creer} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />} Créer le dossier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
