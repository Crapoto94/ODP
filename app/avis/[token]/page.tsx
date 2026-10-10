"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import CityLogo from '@/components/CityLogo';

// Page PUBLIQUE (sans connexion) de réponse d'un service à une demande d'avis sur un tournage. Accès par le lien reçu par e-mail.

const fr = (iso: string) => (iso || '').split('-').reverse().join('/');

export default function AvisPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<any>(null);
  const [erreur, setErreur] = useState('');
  const [avis, setAvis] = useState<'FAVORABLE' | 'DEFAVORABLE' | ''>('');
  const [commentaire, setCommentaire] = useState('');
  const [nom, setNom] = useState('');
  const [reponses, setReponses] = useState<Record<string, any>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [modif, setModif] = useState(false);

  useEffect(() => {
    axios.get(`/api/public/avis/${token}`).then((r) => {
      setInfo(r.data);
      if (r.data.statut === 'FAVORABLE' || r.data.statut === 'DEFAVORABLE') {
        setAvis(r.data.statut); setCommentaire(r.data.reponseCommentaire || ''); setNom(r.data.reponduPar || ''); setReponses(r.data.reponseDonnees || {});
      }
    }).catch((e) => setErreur(e.response?.data?.error || 'Ce lien est invalide ou n\'est plus valable.'));
  }, [token]);

  const dejaRepondu = info && (info.statut === 'FAVORABLE' || info.statut === 'DEFAVORABLE') && !modif && !envoye;

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!avis) { setErreur('Indiquez votre avis : favorable ou défavorable.'); return; }
    if (avis === 'DEFAVORABLE' && commentaire.trim().length < 3) { setErreur('Un avis défavorable doit être motivé : précisez la raison.'); return; }
    setEnvoi(true);
    try {
      await axios.post(`/api/public/avis/${token}`, { avis, commentaire, nom, reponses });
      setEnvoye(true);
    } catch (err: any) { setErreur(err.response?.data?.error || 'Erreur lors de l\'envoi.'); }
    finally { setEnvoi(false); }
  };

  const d = info?.demande;
  const Ligne = ({ k, v }: { k: string; v: any }) => (v === undefined || v === null || v === '' ? null : <p className="text-sm"><span className="text-slate-500">{k} : </span><span className="font-medium text-slate-900">{v}</span></p>);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-9 h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"><CityLogo className="w-full h-full object-contain" /></div>
          <div>
            <p className="text-sm font-bold text-blue-700">VibeODP · Ville d&apos;Ivry-sur-Seine</p>
            <p className="text-xs text-slate-400">Demande d&apos;avis — tournage</p>
          </div>
        </div>

        {erreur && !info && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{erreur}</div>}
        {!info && !erreur && <p className="text-sm text-slate-500">Chargement…</p>}

        {envoye ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-emerald-700">Merci, votre avis a bien été transmis</h2>
            <p className="text-sm text-slate-500 mt-2">La Direction de l&apos;action culturelle en a été informée. Vous pouvez fermer cette page.</p>
          </div>
        ) : info && (
          <>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Avis demandé au service</p>
              <p className="text-lg font-black text-slate-900">{info.service}</p>
              {info.message && <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap"><b>Message de la DAC :</b> {info.message}</p>}
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-1 mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">La demande de tournage</p>
              <p className="font-bold text-slate-900">{d.titre} <span className="text-slate-400 font-normal">· {d.reference}</span></p>
              <Ligne k="Type" v={d.typeFilm} />
              <Ligne k="Société de production" v={d.societe} />
              {d.jours?.length > 0 && <Ligne k="Jours et horaires" v={d.jours.map((j: any) => `${fr(j.date)} (${j.equipeArrivee}–${j.equipeDepart})`).join(' · ')} />}
              <Ligne k="Lieu" v={`${d.lieu || ''}${d.emplacements?.length ? ` — ${d.emplacements.join(', ')}` : ''}`} />
              <Ligne k="Précisions" v={d.precisions} />
              {d.personnes && <Ligne k="Personnes" v={`${d.personnes.equipe || 0} équipe, ${d.personnes.comediens || 0} comédiens, ${d.personnes.figurants || 0} figurants${d.personnes.autres ? `, ${d.personnes.autres} autres` : ''}`} />}
              <Ligne k="Véhicules / matériel" v={d.vehicules} />
              {d.places != null && <Ligne k="Places de stationnement" v={d.places} />}
              {(d.violence || d.armesFactices) && <p className="text-sm text-amber-700 font-semibold">⚠ {d.violence ? 'Scènes de violence' : ''}{d.violence && d.armesFactices ? ' · ' : ''}{d.armesFactices ? 'Armes factices' : ''}</p>}
              {d.synopsis && <details className="pt-1"><summary className="text-sm text-blue-700 cursor-pointer font-semibold">Synopsis et scènes en extérieur</summary><p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{d.synopsis}</p><p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{d.scenes}</p></details>}
            </div>

            {dejaRepondu ? (
              <div className={`rounded-xl p-4 ${info.statut === 'FAVORABLE' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                <p className="font-bold text-slate-900">Vous avez déjà répondu : avis {info.statut === 'FAVORABLE' ? 'favorable' : 'défavorable'}</p>
                {info.reponseCommentaire && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{info.reponseCommentaire}</p>}
                <button onClick={() => setModif(true)} className="mt-3 h-9 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">Modifier ma réponse</button>
              </div>
            ) : (
              <form onSubmit={soumettre} className="space-y-5">
                {(info.questions || []).length > 0 && (
                  <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Questions spécifiques</p>
                    {info.questions.map((q: any) => (
                      <div key={q.id}>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">{q.libelle}</label>
                        {q.type === 'OUINON' ? (
                          <div className="flex gap-3">
                            {[['Oui', true], ['Non', false]].map(([l, v]) => (
                              <label key={String(l)} className={`px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer ${reponses[q.id] === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                                <input type="radio" className="hidden" name={q.id} checked={reponses[q.id] === v} onChange={() => setReponses({ ...reponses, [q.id]: v })} />{l}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea rows={2} value={reponses[q.id] || ''} onChange={(e) => setReponses({ ...reponses, [q.id]: e.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Votre avis <span className="text-rose-500">*</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`rounded-xl border-2 p-4 text-center cursor-pointer font-bold ${avis === 'FAVORABLE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" className="hidden" name="avis" checked={avis === 'FAVORABLE'} onChange={() => setAvis('FAVORABLE')} />👍 Favorable
                    </label>
                    <label className={`rounded-xl border-2 p-4 text-center cursor-pointer font-bold ${avis === 'DEFAVORABLE' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" className="hidden" name="avis" checked={avis === 'DEFAVORABLE'} onChange={() => setAvis('DEFAVORABLE')} />👎 Défavorable
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Commentaire, réserves ou conditions {avis === 'DEFAVORABLE' && <span className="text-rose-500">* (motif obligatoire)</span>}</label>
                  <textarea rows={4} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Conditions de mise à disposition, créneaux possibles, motif du refus…" className="w-full rounded-lg border border-slate-300 p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Votre nom (facultatif)</label>
                  <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Prénom Nom, fonction" className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm" />
                </div>

                {erreur && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm" role="alert">{erreur}</div>}
                <button type="submit" disabled={envoi} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-60">{envoi ? 'Envoi…' : 'Envoyer mon avis'}</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
