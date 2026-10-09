"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, MapPin } from 'lucide-react';
import StatutPill from '@/components/v2/StatutPill';

// Cartes dépliables de la nouvelle interface pour les listes TLPE et Commerces (même langage visuel que la liste des chantiers) :
// identité du redevable, badges, chiffres clés, statut ; le dépliage détaille les dossiers année par année.

export interface TiersYearRow {
  key: string;
  year: number;
  type: 'TLPE' | 'COMMERCE';
  statut: string;
  total: number;
  nbDispositifs: number;
  href: string;
}

export interface TiersCardData {
  id: number;
  href: string;
  title: string;
  subtitle?: string | null;
  adresse?: string | null;
  code?: string | null;
  accent: 'purple' | 'blue';
  header?: string | null; // intitulé de groupe affiché au-dessus de la carte (ex. rue)
  badges?: React.ReactNode; // alertes, enseigne, fermé…
  leading?: React.ReactNode; // ex. étoile favori
  figures: { label: string; value: React.ReactNode }[];
  statut?: string;
  years: TiersYearRow[];
}

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ACCENT = {
  purple: { avatar: 'bg-violet-600', ring: 'hover:border-violet-200' },
  blue: { avatar: 'bg-blue-600', ring: 'hover:border-blue-200' },
} as const;
const TYPE_CHIP: Record<string, string> = { TLPE: 'bg-violet-50 text-violet-700 border-violet-200', COMMERCE: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
const TYPE_LABEL: Record<string, string> = { TLPE: 'TLPE', COMMERCE: 'Commerce' };

export default function TiersCardsV2({ cards, emptyLabel = 'Aucun dossier trouvé' }: { cards: TiersCardData[]; emptyLabel?: string }) {
  const [open, setOpen] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  useEffect(() => { setPage(1); }, [cards.length, perPage]);

  const total = cards.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pages);
  const start = (current - 1) * perPage;
  const rows = cards.slice(start, start + perPage);
  const toggle = (id: number) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  if (total === 0) {
    return <div className="py-16 text-center text-sm font-semibold text-slate-400 bg-white rounded-2xl border border-[#e2e8f0]">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((c, idx) => {
        const a = ACCENT[c.accent];
        const isOpen = open.includes(c.id);
        const prevHeader = idx > 0 ? rows[idx - 1].header : undefined;
        return (
          <React.Fragment key={c.id}>
            {c.header && c.header !== prevHeader && (
              <div className="flex items-center gap-3 pt-3">
                <MapPin size={14} className="text-blue-500" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{c.header}</h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div className={`@container bg-white rounded-2xl border ${isOpen ? 'border-slate-300 shadow-[0_4px_12px_rgba(15,23,42,0.08)]' : 'border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.05)]'} ${a.ring} overflow-hidden transition-shadow`}>
              <div className="grid grid-cols-2 @3xl:grid-cols-4 @6xl:grid-cols-[minmax(0,3.4fr)_minmax(0,2.6fr)_minmax(0,2fr)_auto] gap-x-5 gap-y-3 items-center px-5 py-4">
                {/* Identité */}
                <div className="col-span-2 @3xl:col-span-4 @6xl:col-span-1 min-w-0 flex items-start gap-3">
                  {c.leading}
                  <div className={`w-10 h-10 rounded-xl ${a.avatar} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
                    {c.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Link href={c.href} className="block text-[15px] font-bold text-slate-900 hover:text-blue-600 leading-snug truncate">{c.title}</Link>
                    {c.subtitle && <p className="text-xs text-slate-500 truncate">{c.subtitle}</p>}
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 min-w-0">
                      {c.code && <span className="tabular-nums font-semibold text-slate-600 shrink-0">{c.code}</span>}
                      {c.code && c.adresse && <span className="text-slate-300">·</span>}
                      {c.adresse && <span className="truncate flex items-center gap-1"><MapPin size={12} className="shrink-0" /><span className="truncate">{c.adresse}</span></span>}
                    </p>
                  </div>
                </div>

                {/* Badges (dispositifs, enseignes, alertes…) */}
                <div className="col-span-2 @3xl:col-span-2 @6xl:col-span-1 min-w-0 flex flex-wrap items-center gap-1.5">{c.badges}</div>

                {/* Chiffres clés */}
                <div className="col-span-2 @3xl:col-span-2 @6xl:col-span-1 flex flex-wrap gap-x-6 gap-y-1">
                  {c.figures.map((f) => (
                    <div key={f.label} className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{f.label}</p>
                      <p className="text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Statut + actions */}
                <div className="col-span-2 @3xl:col-span-4 @6xl:col-span-1 flex items-center justify-between @6xl:justify-end gap-3">
                  <StatutPill statut={c.statut} />
                  <div className="flex items-center gap-1">
                    <Link href={c.href} title="Ouvrir le dossier" className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"><ExternalLink size={16} /></Link>
                    <button type="button" onClick={() => toggle(c.id)} title={isOpen ? 'Replier les années' : 'Voir les dossiers par année'} aria-label="Détail par année" className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/60 px-5 py-4 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Dossiers par année</h4>
                  {c.years.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun dossier.</p>
                  ) : (
                    <div className="overflow-x-auto bg-white border border-[#e2e8f0] rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            <th className="px-4 py-2.5 w-24">Année</th>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Statut</th>
                            <th className="px-4 py-2.5 text-right">Dispositifs</th>
                            <th className="px-4 py-2.5 text-right">Montant TTC</th>
                            <th className="px-4 py-2.5 w-24" />
                          </tr>
                        </thead>
                        <tbody>
                          {c.years.map((y) => (
                            <tr key={y.key} className="border-t border-slate-100 hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-bold text-slate-900 tabular-nums">{y.year}</td>
                              <td className="px-4 py-2.5"><span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-semibold ${TYPE_CHIP[y.type]}`}>{TYPE_LABEL[y.type]}</span></td>
                              <td className="px-4 py-2.5"><StatutPill statut={y.statut} /></td>
                              <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{y.nbDispositifs}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">{eur(y.total)} €</td>
                              <td className="px-4 py-2.5 text-right"><Link href={y.href} className="text-xs font-semibold text-blue-600 hover:underline">Ouvrir</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>Affichage de <b className="text-slate-800 tabular-nums">{start + 1} - {Math.min(start + perPage, total)}</b> sur <b className="text-slate-800 tabular-nums">{total}</b> dossier{total > 1 ? 's' : ''}</span>
          <label className="flex items-center gap-2">Afficher :
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="bg-white border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm text-slate-700">
              {[15, 25, 50, 100].map((n) => <option key={n} value={n}>{n} par page</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button disabled={current <= 1} onClick={() => setPage(current - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white disabled:opacity-40"><ChevronLeft size={14} /> Précédent</button>
          {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1).map((n, i, arr) => (
            <React.Fragment key={n}>
              {i > 0 && n - arr[i - 1] > 1 && <span className="px-1">…</span>}
              <button onClick={() => setPage(n)} className={`w-9 h-9 rounded-lg text-sm font-semibold tabular-nums ${n === current ? 'bg-blue-600 text-white' : 'bg-white border border-[#e2e8f0] text-slate-700 hover:bg-slate-50'}`}>{n}</button>
            </React.Fragment>
          ))}
          <button disabled={current >= pages} onClick={() => setPage(current + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white disabled:opacity-40">Suivant <ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
