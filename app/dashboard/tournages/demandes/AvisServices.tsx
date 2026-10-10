"use client";

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Send, Plus, Trash2, Loader2, X, RefreshCw, Ban, Copy, MessageSquare, Building2 } from 'lucide-react';
import { STATUTS_AVIS } from '@/lib/tournage-regles';

const fmt = (d: any) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

// Pastilles de synthèse des avis (liste des demandes) : ✔ favorables, ✖ défavorables, ⏳ sans retour
export function AvisPastilles({ avis }: { avis: { serviceNom: string; statut: string }[] }) {
  if (!avis?.length) return <span className="text-xs text-slate-400">—</span>;
  const n = (s: string) => avis.filter((a) => a.statut === s).length;
  const titre = avis.map((a) => `${a.serviceNom} : ${STATUTS_AVIS[a.statut]?.label || a.statut}`).join('\n');
  return (
    <span className="inline-flex flex-wrap gap-1" title={titre}>
      {n('FAVORABLE') > 0 && <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">✔ {n('FAVORABLE')}</span>}
      {n('DEFAVORABLE') > 0 && <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold">✖ {n('DEFAVORABLE')}</span>}
      {n('EN_ATTENTE') > 0 && <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">⏳ {n('EN_ATTENTE')}</span>}
    </span>
  );
}

// Section « Avis des services » de la fiche d'une demande : liste des avis, demande d'avis (services paramétrés ou adresses « à la volée »), relance
export default function AvisServices({ demandeId, onChange }: { demandeId: number; onChange?: () => void }) {
  const [avis, setAvis] = useState<any[] | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const charger = useCallback(() => {
    axios.get(`/api/tournages/demandes/${demandeId}/avis`).then((r) => setAvis(r.data)).catch(() => setAvis([]));
  }, [demandeId]);
  useEffect(() => { setAvis(null); charger(); }, [charger]);

  const action = async (a: any, act: 'relancer' | 'annuler') => {
    if (act === 'annuler' && !confirm(`Annuler la demande d'avis à « ${a.serviceNom} » ? Le lien ne fonctionnera plus.`)) return;
    setBusy(a.id); setInfo(null);
    try {
      await axios.patch(`/api/tournages/avis/${a.id}`, { action: act });
      setInfo(act === 'relancer' ? `Relance envoyée à ${a.serviceNom}` : 'Demande d\'avis annulée');
      charger(); onChange?.();
    } catch (e: any) { setInfo(e.response?.data?.error || e.message); }
    finally { setBusy(null); }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Avis des services</h4>
        <button onClick={() => setOuvert(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"><Send size={13} /> Demander un avis</button>
      </div>
      <div className="p-4 space-y-3">
        {info && <p className="text-xs font-semibold text-slate-600">{info}</p>}
        {avis === null ? <Loader2 size={16} className="animate-spin text-slate-400" /> : avis.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun avis demandé. La DAC peut consulter la direction de l&apos;espace public, les sports, l&apos;éducation, le CMS, les salles municipales…</p>
        ) : avis.map((a) => {
          const s = STATUTS_AVIS[a.statut] || { label: a.statut, cls: 'bg-slate-100 text-slate-600' };
          const questions: any[] = Array.isArray(a.questions) ? a.questions : [];
          return (
            <div key={a.id} className={`rounded-lg border border-slate-200 p-3 space-y-2 ${a.statut === 'ANNULE' ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-sm text-slate-900 flex items-center gap-2"><Building2 size={14} className="text-slate-400" /> {a.serviceNom}{a.libre && <span className="text-[10px] font-bold uppercase text-slate-400">avis libre</span>}</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>
              </div>
              <p className="text-xs text-slate-500">Demandé le {fmt(a.dateDemande)}{a.demandePar ? ` par ${a.demandePar}` : ''} · à {(Array.isArray(a.destinataires) ? a.destinataires : []).join(', ')}{a.nbRelances ? ` · ${a.nbRelances} relance(s)` : ''}</p>
              {a.message && <p className="text-xs text-slate-600 whitespace-pre-wrap"><MessageSquare size={11} className="inline mr-1 text-slate-400" />{a.message}</p>}
              {(a.statut === 'FAVORABLE' || a.statut === 'DEFAVORABLE') && (
                <div className={`rounded-lg p-3 text-sm space-y-1 ${a.statut === 'FAVORABLE' ? 'bg-emerald-50/70' : 'bg-rose-50/70'}`}>
                  <p className="text-xs text-slate-500">Réponse du {fmt(a.dateReponse)}{a.reponduPar ? ` par ${a.reponduPar}` : ''}</p>
                  {a.reponseCommentaire && <p className="whitespace-pre-wrap">{a.reponseCommentaire}</p>}
                  {questions.map((q) => {
                    const v = a.reponseDonnees?.[q.id];
                    return <p key={q.id} className="text-xs"><span className="text-slate-500">{q.libelle} :</span> <b>{v === true ? 'Oui' : v === false ? 'Non' : v || '—'}</b></p>;
                  })}
                </div>
              )}
              {a.statut === 'EN_ATTENTE' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button disabled={busy === a.id} onClick={() => action(a, 'relancer')} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={12} /> Relancer</button>
                  <button onClick={() => { navigator.clipboard?.writeText(a.lien); setInfo('Lien de réponse copié'); }} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Copy size={12} /> Copier le lien</button>
                  <button disabled={busy === a.id} onClick={() => action(a, 'annuler')} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Ban size={12} /> Annuler</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {ouvert && <ModaleAvis demandeId={demandeId} onClose={() => setOuvert(false)} onDone={() => { charger(); onChange?.(); }} />}
    </section>
  );
}

function ModaleAvis({ demandeId, onClose, onDone }: { demandeId: number; onClose: () => void; onDone: () => void }) {
  const [services, setServices] = useState<any[] | null>(null);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [libres, setLibres] = useState<{ nom: string; emails: string }[]>([]);
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [resultats, setResultats] = useState<any[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => { axios.get('/api/tournages/services').then((r) => setServices(r.data.filter((s: any) => s.actif))).catch(() => setServices([])); }, []);

  const valider = async () => {
    setEnvoi(true); setErreur(null);
    try {
      const r = await axios.post(`/api/tournages/demandes/${demandeId}/avis`, { serviceIds: choisis, libres: libres.filter((l) => l.emails.trim()), message });
      setResultats(r.data.resultats); onDone();
    } catch (e: any) { setErreur(e.response?.data?.error || e.message); }
    finally { setEnvoi(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-900">Demander un avis</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16} /></button>
        </header>
        {resultats ? (
          <div className="p-5 space-y-3">
            {resultats.map((r, i) => (
              <p key={i} className={`text-sm rounded-lg px-3 py-2 ${r.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}><b>{r.service}</b> — {r.ok ? 'demande envoyée' : r.erreur}</p>
            ))}
            <button onClick={onClose} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold">Fermer</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <p className="text-[13px] font-semibold text-slate-700 mb-2">Services consultés</p>
              {services === null ? <Loader2 size={16} className="animate-spin text-slate-400" /> : services.length === 0 ? <p className="text-sm text-slate-500">Aucun service paramétré.</p> : (
                <div className="space-y-1.5">
                  {services.map((s) => {
                    const emails: string[] = Array.isArray(s.emails) ? s.emails : [];
                    return (
                      <label key={s.id} className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer ${choisis.includes(s.id) ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="mt-1" checked={choisis.includes(s.id)} onChange={(e) => setChoisis(e.target.checked ? [...choisis, s.id] : choisis.filter((x) => x !== s.id))} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">{s.nom}{s.circuitPropre && <span className="ml-2 text-[10px] font-bold uppercase text-violet-600">circuit propre</span>}</span>
                          <span className="block text-xs text-slate-500">{emails.length ? emails.join(', ') : <span className="text-rose-600 font-semibold">aucune adresse e-mail paramétrée</span>}</span>
                          {Array.isArray(s.questions) && s.questions.length > 0 && <span className="block text-[11px] text-slate-400">{s.questions.length} question(s) spécifique(s)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-slate-700">Avis libre (adresses à la volée)</p>
                <button onClick={() => setLibres([...libres, { nom: '', emails: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><Plus size={13} /> Ajouter</button>
              </div>
              {libres.map((l, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 mb-2">
                  <input value={l.nom} onChange={(e) => setLibres(libres.map((x, k) => (k === i ? { ...x, nom: e.target.value } : x)))} placeholder="Service / personne consultée" className="h-9 px-3 rounded-lg border border-slate-200 text-sm" />
                  <input value={l.emails} onChange={(e) => setLibres(libres.map((x, k) => (k === i ? { ...x, emails: e.target.value } : x)))} placeholder="adresse1@…; adresse2@…" className="h-9 px-3 rounded-lg border border-slate-200 text-sm" />
                  <button onClick={() => setLibres(libres.filter((_, k) => k !== i))} className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"><Trash2 size={14} /></button>
                </div>
              ))}
              {libres.length === 0 && <p className="text-xs text-slate-500">Pour consulter un interlocuteur non paramétré (gestionnaire de salle, partenaire…).</p>}
            </div>

            <div>
              <p className="text-[13px] font-semibold text-slate-700 mb-2">Message (facultatif)</p>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Précisez la question posée, la date limite de réponse souhaitée…" className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
            </div>

            {erreur && <p className="text-sm text-rose-600 font-semibold">{erreur}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Annuler</button>
              <button disabled={envoi || (choisis.length === 0 && libres.every((l) => !l.emails.trim()))} onClick={valider} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{envoi ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer la demande</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
