"use client";

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Clapperboard, Search, Loader2, X, FileText, Paperclip, Calendar, AlertTriangle, Save, Building2, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUTS_DEMANDE } from '@/lib/tournage-regles';
import AvisServices, { AvisPastilles } from './AvisServices';
import DossierLien from './DossierLien';
import SimulationFinanciere from './SimulationFinanciere';

const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');
const fmtIso = (s?: string) => (s ? s.split('-').reverse().join('/') : '—');

function Pastille({ statut }: { statut: string }) {
  const s = STATUTS_DEMANDE[statut] || { label: statut, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <h4 className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">{titre}</h4>
      <div className="p-4 text-sm text-slate-700 space-y-1.5">{children}</div>
    </section>
  );
}
const L = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <p><span className="text-slate-500">{k} : </span><span className="font-medium text-slate-900">{v === '' || v == null ? '—' : v}</span></p>
);

export default function DemandesTournagesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('ALL');
  const [filtreAvis, setFiltreAvis] = useState('ALL');
  const [page, setPage] = useState(1);
  const [parPage, setParPage] = useState(15);
  const [detail, setDetail] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifier, setNotifier] = useState(false);
  const [message, setMessage] = useState('');
  const [retourMail, setRetourMail] = useState<string | null>(null);

  const charger = () => {
    setLoading(true);
    axios.get('/api/tournages/demandes').then((r) => { setRows(r.data); setErreur(null); })
      .catch((e) => setErreur(e.response?.data?.error || e.message)).finally(() => setLoading(false));
  };
  useEffect(charger, []);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) ouvrir(Number(id)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrir = async (id: number) => {
    const r = await axios.get(`/api/tournages/demandes/${id}`);
    setDetail(r.data); setNotes(r.data.notesInternes || ''); setNotifier(false); setMessage(''); setRetourMail(null);
  };
  const maj = async (patch: any) => {
    if (!detail) return;
    setSaving(true);
    setRetourMail(null);
    try {
      const r = await axios.patch(`/api/tournages/demandes/${detail.id}`, patch);
      if (r.data.mail) setRetourMail(r.data.mail.envoye ? `E-mail envoyé à ${r.data.email}` : `E-mail non envoyé : ${r.data.mail.erreur || 'erreur'}`);
      setDetail(r.data);
      setRows((rs) => rs.map((x) => (x.id === r.data.id ? { ...x, statut: r.data.statut } : x)));
    } finally { setSaving(false); }
  };

  const filtrees = useMemo(() => rows.filter((r) => {
    if (filtre !== 'ALL' && r.statut !== filtre) return false;
    const av: any[] = r.avis || [];
    if (filtreAvis === 'ATTENTE' && !av.some((a) => a.statut === 'EN_ATTENTE')) return false;
    if (filtreAvis === 'DEFAVORABLE' && !av.some((a) => a.statut === 'DEFAVORABLE')) return false;
    if (filtreAvis === 'FAVORABLE' && !(av.length > 0 && av.every((a) => a.statut === 'FAVORABLE'))) return false;
    if (filtreAvis === 'AUCUN' && av.length > 0) return false;
    const t = q.trim().toLowerCase();
    return !t || [r.reference, r.societe, r.demandeurNom, r.titre, r.email].some((v) => String(v || '').toLowerCase().includes(t));
  }), [rows, q, filtre, filtreAvis]);

  // Pagination : retour à la première page quand la recherche, un filtre ou la taille de page change
  useEffect(() => { setPage(1); }, [q, filtre, filtreAvis, parPage]);
  const nbPages = Math.max(1, Math.ceil(filtrees.length / parPage));
  const pageCourante = Math.min(page, nbPages);
  const debut = (pageCourante - 1) * parPage;
  const visibles = filtrees.slice(debut, debut + parPage);

  const compte = (s: string) => rows.filter((r) => r.statut === s).length;
  const d = detail?.donnees || {};
  const enRetard = (r: any) => r.dateLimiteReponse && ['NOUVELLE', 'EN_INSTRUCTION', 'COMPLEMENT'].includes(r.statut) && new Date(r.dateLimiteReponse) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Clapperboard size={22} /></span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Demandes de tournages</h1>
            <p className="text-sm text-slate-500">Demandes d&apos;autorisation déposées depuis le site de la ville</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[['NOUVELLE', 'à traiter'], ['EN_INSTRUCTION', 'en instruction'], ['COMPLEMENT', 'compléments']].map(([s, l]) => (
            <div key={s} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm"><b className="text-slate-900 tabular-nums">{compte(s)}</b> <span className="text-slate-500">{l}</span></div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (référence, société, titre, e-mail…)" className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm" />
        </div>
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="ALL">Tous les statuts</option>
          {Object.entries(STATUTS_DEMANDE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtreAvis} onChange={(e) => setFiltreAvis(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white" title="Avis des services">
          <option value="ALL">Avis : tous</option>
          <option value="ATTENTE">Avis sans retour</option>
          <option value="DEFAVORABLE">Au moins un avis défavorable</option>
          <option value="FAVORABLE">Tous les avis favorables</option>
          <option value="AUCUN">Aucun avis demandé</option>
        </select>
      </div>

      {erreur && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{erreur}</div>}

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : filtrees.length === 0 ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-400 bg-white rounded-2xl border border-slate-200">Aucune demande</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-5 py-3">Référence</th><th className="px-5 py-3">Projet</th><th className="px-5 py-3">Société</th>
                <th className="px-5 py-3">Dates de tournage</th><th className="px-5 py-3">Reçue le</th><th className="px-5 py-3">Réponse avant le</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Avis des services</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.id} onClick={() => ouvrir(r.id)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">{r.reference}{r.occupationId ? <span title={`Dossier ODP #${r.occupationId}`} className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Dossier #{r.occupationId}</span> : null}</td>
                  <td className="px-5 py-3.5"><p className="font-semibold text-slate-900">{r.titre}</p><p className="text-xs text-slate-500">{r.typeFilm}</p></td>
                  <td className="px-5 py-3.5"><p>{r.societe}</p><p className="text-xs text-slate-500">{r.demandeurNom}</p></td>
                  <td className="px-5 py-3.5 tabular-nums">{fmtDate(r.premiereDate)}{r.derniereDate && r.derniereDate !== r.premiereDate ? ` → ${fmtDate(r.derniereDate)}` : ''}</td>
                  <td className="px-5 py-3.5 tabular-nums">{fmtDate(r.dateDepot)}</td>
                  <td className={`px-5 py-3.5 tabular-nums ${enRetard(r) ? 'text-rose-600 font-bold' : ''}`}>{enRetard(r) && <AlertTriangle size={13} className="inline mr-1" />}{fmtDate(r.dateLimiteReponse)}</td>
                  <td className="px-5 py-3.5"><Pastille statut={r.statut} /></td>
                  <td className="px-5 py-3.5"><AvisPastilles avis={r.avis || []} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span>Affichage de <b className="text-slate-800 tabular-nums">{debut + 1} - {Math.min(debut + parPage, filtrees.length)}</b> sur <b className="text-slate-800 tabular-nums">{filtrees.length}</b> demande{filtrees.length > 1 ? 's' : ''}{filtrees.length !== rows.length ? <span className="text-slate-400"> (filtrées sur {rows.length})</span> : null}</span>
              <label className="flex items-center gap-2">Afficher :
                <select value={parPage} onChange={(e) => setParPage(Number(e.target.value))} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700">
                  {[15, 25, 50, 100].map((n) => <option key={n} value={n}>{n} par page</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={pageCourante <= 1} onClick={() => setPage(pageCourante - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft size={14} /> Précédent</button>
              {Array.from({ length: nbPages }, (_, i) => i + 1).filter((n) => n === 1 || n === nbPages || Math.abs(n - pageCourante) <= 1).map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && n - arr[i - 1] > 1 && <span className="px-1">…</span>}
                  <button onClick={() => setPage(n)} className={`w-9 h-9 rounded-lg text-sm font-semibold tabular-nums ${n === pageCourante ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{n}</button>
                </React.Fragment>
              ))}
              <button disabled={pageCourante >= nbPages} onClick={() => setPage(pageCourante + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40">Suivant <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40" onClick={() => setDetail(null)}>
          <aside className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 tabular-nums">{detail.reference}</p>
                <h2 className="text-xl font-black text-slate-900 truncate">{detail.titre}</h2>
                <div className="mt-1 flex items-center gap-2"><Pastille statut={detail.statut} /><span className="text-xs text-slate-500">Reçue le {fmtDate(detail.dateDepot)} · réponse avant le {fmtDate(detail.dateLimiteReponse)}</span></div>
              </div>
              <button onClick={() => setDetail(null)} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X size={18} /></button>
            </header>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUTS_DEMANDE).map(([k, v]) => (
                  <button key={k} disabled={saving || detail.statut === k} onClick={() => maj({ statut: k, notifier: notifier && ['ACCORD', 'COMPLEMENT', 'REFUSEE'].includes(k), message })} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${detail.statut === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'} disabled:opacity-60`}>{v.label}</button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={notifier} onChange={(e) => setNotifier(e.target.checked)} /> Envoyer un e-mail au demandeur lors d&apos;un accord, d&apos;un complément ou d&apos;un refus
                </label>
                {notifier && <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Message au demandeur (conditions, réserves, éléments manquants, motif du refus…)" />}
                {retourMail && <p className={`text-xs font-semibold ${retourMail.startsWith('E-mail envoyé') ? 'text-emerald-600' : 'text-rose-600'}`}>{retourMail}</p>}
              </div>
              {detail.traiteePar && <p className="text-xs text-slate-500">Dernier traitement par {detail.traiteePar}</p>}

              <Bloc titre="Demandeur">
                <p className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" /> <b>{detail.societe}</b> — {detail.demandeurNom}</p>
                <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> <a className="text-blue-600" href={`mailto:${detail.email}`}>{detail.email}</a></p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {detail.telephone || '—'}</p>
              </Bloc>

              <Bloc titre="Projet">
                <L k="Type de film" v={detail.typeFilm} />
                <L k="Scènes de violence" v={d.violence ? 'Oui' : 'Non'} />
                <L k="Armes factices" v={d.armesFactices ? 'Oui' : 'Non'} />
                <p className="pt-1 text-slate-500">Synopsis / sujet</p><p className="whitespace-pre-wrap">{d.synopsis}</p>
                <p className="pt-1 text-slate-500">Scènes à tourner en extérieur</p><p className="whitespace-pre-wrap">{d.scenes}</p>
              </Bloc>

              <Bloc titre="Jours et horaires">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1">Date</th><th>Équipe</th><th>Véhicules techniques</th></tr></thead>
                  <tbody>{(d.jours || []).map((j: any) => (
                    <tr key={j.date} className="border-t border-slate-100"><td className="py-1.5 font-semibold">{fmtIso(j.date)}</td><td>{j.equipeArrivee} → {j.equipeDepart}</td><td>{j.vehiculesArrivee ? `${j.vehiculesArrivee} → ${j.vehiculesDepart}` : '—'}</td></tr>
                  ))}</tbody>
                </table>
              </Bloc>

              <Bloc titre="Lieu et stationnement">
                <L k="Emplacements" v={(d.lieu?.emplacements || []).join(', ')} />
                <L k="Adresse" v={d.lieu?.adresse} />
                {d.lieu?.precisions && <L k="Précisions" v={d.lieu.precisions} />}
                <L k="Véhicules / matériel" v={d.vehicules?.description} />
                {(d.vehicules?.nbPlaces != null || d.vehicules?.localisation) && <L k="Places de stationnement occupées" v={d.vehicules?.nbPlaces} />}
                {d.vehicules?.localisation && <L k="Localisation des places" v={d.vehicules?.localisation} />}
                <L k="Personnes mobilisées" v={`${d.personnes?.equipe || 0} équipe · ${d.personnes?.comediens || 0} comédiens · ${d.personnes?.figurants || 0} figurants${d.personnes?.autres ? ` · ${d.personnes.autres} autres${d.personnes.autresPrecision ? ` (${d.personnes.autresPrecision})` : ''}` : ''}`} />
              </Bloc>

              <Bloc titre="Plan de tournage">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1">Date</th><th>Lieu</th><th>Heures</th><th>Matériel</th></tr></thead>
                  <tbody>{(d.plan || []).map((p: any, i: number) => (
                    <tr key={i} className="border-t border-slate-100 align-top"><td className="py-1.5 font-semibold">{fmtIso(p.date)}</td><td>{p.lieu}</td><td>{p.heures}</td><td>{p.materiel}</td></tr>
                  ))}</tbody>
                </table>
              </Bloc>

              {(d.etudiant || d.cas?.drone || d.cas?.passerelle || d.cas?.cormailles) && (
                <Bloc titre="Cas particuliers">
                  {d.etudiant && <L k="Projet étudiant" v={`${d.ecole?.nom || ''} — ${d.ecole?.contact || ''} · ${d.ecole?.telephone || ''} · ${d.ecole?.email || ''}`} />}
                  {d.cas?.drone && <p>🚁 Utilisation de drones (déclaration Cerfa 15476*02 à vérifier)</p>}
                  {d.cas?.passerelle && <p>🌉 Site de la passerelle aux câbles (demande au bureau du film de la Ville de Paris)</p>}
                  {d.cas?.cormailles && <p>🌳 Parc des Cormailles (demande au Conseil départemental du Val-de-Marne)</p>}
                </Bloc>
              )}

              <Bloc titre="Pièces jointes">
                {(detail.pieces || []).length === 0 ? <p className="text-slate-500">Aucune pièce.</p> : (detail.pieces as any[]).map((p, i) => (
                  <a key={i} href={p.chemin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><Paperclip size={14} /> {p.libelle} <span className="text-slate-400 text-xs">— {p.nom}</span></a>
                ))}
              </Bloc>

              <SimulationFinanciere demandeId={detail.id} />

              <AvisServices demandeId={detail.id} onChange={charger} />

              <DossierLien demande={detail} onChange={() => { charger(); ouvrir(detail.id); }} />

              <Bloc titre="Notes internes">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Réserves, rendez-vous sur site, conditions techniques et financières…" />
                <button onClick={() => maj({ notesInternes: notes })} disabled={saving} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"><Save size={14} /> Enregistrer la note</button>
              </Bloc>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
