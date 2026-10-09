"use client";

import React, { useEffect, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Archive, ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  DollarSign, FileText, MapPin, Pencil, Plus, Trash2, Unlock,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusConfig } from '@/lib/status-utils';
import { getAlertConfig } from '@/lib/alert-utils';
import { hasPermission } from '@/lib/permissions';

// Liste des dossiers (chantiers / tournages) de la nouvelle interface : une carte par dossier
// (maquette Stitch « Chantiers — liste des dossiers »), avec sous-détail des articles tarifaires dépliable.

interface Props {
  occupations: any[];
  view: 'ACTIVE' | 'ARCHIVE';
  currentUser: any;
  expandedRows: number[];
  onToggleRow: (id: number) => void;
  onShowDetail: (id: number) => void;
  onEdit: (occ: any) => void;
  onAddLigne: (occ: any) => void;
  onEditLigne: (occ: any, ligne: any) => void;
  onDeleteLigne: (occId: number, ligneId: number) => void;
  onApprove: (id: number) => void;
  onNextStep: (id: number, statut: string) => void;
  onDownloadFacture: (id: number) => void;
  onUnlock: (id: number) => void;
  onArchive: (id: number, nom: string) => void;
  onUnarchive: (id: number, nom: string) => void;
  onDelete: (id: number, nom: string) => void;
}

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayMonth = (d?: string | null) => (d ? format(new Date(d), 'd MMM', { locale: fr }) : '—');
const dayMonthYear = (d?: string | null) => (d ? format(new Date(d), 'd MMM yyyy', { locale: fr }) : '—');

// Mode de taxation « m² / jour » → unités d'assiette
function unitsOf(ligne: any) {
  const raw: string = ligne.article?.modeTaxation?.nom || '';
  const parts = raw.split('/').map((p) => p.trim()).filter(Boolean);
  return { u1: (parts[0] || 'unité').toLowerCase(), u2: (parts[1] || '').toLowerCase(), raw };
}

const activeLignes = (occ: any) => (occ.lignes || []).filter((l: any) => !l.deletedAt);

function totalAmount(occ: any) {
  let amount = occ.isExempt ? 0 : (occ.montantCalcule || 0);
  if (occ.isNotAuthorized) amount *= 2; // majoration 100 % si non autorisé
  return amount;
}

// Emprise / surface cumulée : somme des quantités exprimées en m²
function surfaceOf(occ: any) {
  return activeLignes(occ).reduce((s: number, l: any) => (/m\s?[²2]|m2/i.test(unitsOf(l).u1) ? s + (Number(l.quantite1) || 0) : s), 0);
}

export default function OccupationCardsV2(p: Props) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Retour en première page quand la liste change (filtres, recherche, vue)
  useEffect(() => { setPage(1); }, [p.occupations.length, p.view, perPage]);

  const total = p.occupations.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pages);
  const start = (current - 1) * perPage;
  const rows = p.occupations.slice(start, start + perPage);
  const canModify = p.currentUser?.role && hasPermission(p.currentUser.role, 'MODIFY_DOSSIER');

  return (
    <div className="space-y-3">
      {rows.map((occ) => {
        const status = getStatusConfig(occ.type, occ.statut);
        const alert = getAlertConfig(occ.dateAlerte);
        const lignes = activeLignes(occ);
        const surface = surfaceOf(occ);
        const jours = occ.dateDebut && occ.dateFin ? differenceInDays(new Date(occ.dateFin), new Date(occ.dateDebut)) + 1 : null;
        const open = p.expandedRows.includes(occ.id);
        const edge = alert.status === 'overdue' ? 'border-l-[6px] border-l-rose-600' : alert.status === 'upcoming' ? 'border-l-[6px] border-l-amber-500' : '';
        const nom = occ.nom || `Dossier #${occ.id}`;

        return (
          <div key={occ.id} className={`bg-white rounded-2xl border ${open ? 'border-blue-200 shadow-[0_4px_12px_rgba(15,23,42,0.08)]' : 'border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.05)]'} ${edge} overflow-hidden transition-shadow`}>
            <div className="grid grid-cols-12 gap-x-4 gap-y-3 items-center px-5 py-4">
              {/* Dossier */}
              <div className="col-span-12 lg:col-span-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => p.onShowDetail(occ.id)} className="text-sm font-bold text-blue-600 hover:underline tabular-nums">#{occ.id}</button>
                  {alert.status !== 'none' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${alert.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      <AlertTriangle size={11} /> {alert.label}
                    </span>
                  )}
                  {occ.isExempt && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Exonéré de facturation"><DollarSign size={11} /> Exonéré</span>}
                  {occ.isNotAuthorized && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200" title="Non autorisé — majoration 100 %"><AlertCircle size={11} /> Non autorisé</span>}
                </div>
                <button onClick={() => p.onShowDetail(occ.id)} className="mt-1 block text-left text-[15px] font-bold text-slate-900 hover:text-blue-600 leading-snug">{nom}</button>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 truncate"><MapPin size={12} className="shrink-0" /> <span className="truncate">{occ.adresse || '—'}</span></p>
              </div>

              {/* Demandeur */}
              <div className="col-span-6 lg:col-span-2 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{occ.tiers?.nom || 'Inconnu'}</p>
                <p className="text-xs text-slate-500 truncate">
                  {occ.tiers?.code_sedit ? <>Code tiers : <span className="tabular-nums">{occ.tiers.code_sedit}</span></> : '—'}
                </p>
                {occ.tiers?.etatAdministratif === 'Cessée' && (
                  <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle size={11} /> Fermé</span>
                )}
              </div>

              {/* Période */}
              <div className="col-span-6 lg:col-span-2">
                <p className="text-sm font-semibold text-slate-900 tabular-nums">{dayMonth(occ.dateDebut)} → {dayMonthYear(occ.dateFin)}</p>
                <p className="text-xs text-slate-500">{jours ? `Durée totale : ${jours} jour${jours > 1 ? 's' : ''}` : '—'}</p>
              </div>

              {/* Articles */}
              <div className="col-span-6 lg:col-span-2">
                <p className="text-sm font-semibold text-slate-900">{lignes.length} article{lignes.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-500 tabular-nums">{surface > 0 ? `${lignes.length > 1 ? 'Surface cumulée' : 'Emprise sol'} : ${surface.toLocaleString('fr-FR')} m²` : `${occ._count?.notes || 0} note${(occ._count?.notes || 0) > 1 ? 's' : ''}`}</p>
              </div>

              {/* Montant */}
              <div className="col-span-6 lg:col-span-1 lg:text-right">
                <p className="text-base font-bold text-slate-900 tabular-nums">{eur(totalAmount(occ))} €</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">TTC</p>
              </div>

              {/* Statut + actions */}
              <div className="col-span-12 lg:col-span-2 flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-2">
                <div className="flex flex-col items-start lg:items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color} ${status.border || ''}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />{status.label || occ.statut}
                  </span>
                  {occ.facturePath && (
                    <a href={occ.facturePath} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"><FileText size={11} /> Facture</a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {p.view === 'ACTIVE' && !occ.isArchived && (
                    <>
                      {['EN_ATTENTE', 'EN_COURS'].includes(occ.statut) && <IconBtn title="Approuver" tone="emerald" onClick={() => p.onApprove(occ.id)}><CheckCircle2 size={16} /></IconBtn>}
                      {['EN_ATTENTE', 'INIT', 'INST', 'PREP', 'EN_COURS'].includes(occ.statut) && <IconBtn title="Étape suivante" tone="violet" onClick={() => p.onNextStep(occ.id, occ.statut)}><ArrowRight size={16} /></IconBtn>}
                      {['VERIFIE', 'FACTURE', 'PAYE'].includes(occ.statut) && <IconBtn title="Télécharger la facture" tone="blue" onClick={() => p.onDownloadFacture(occ.id)}><FileText size={16} /></IconBtn>}
                      {['FACTURE', 'PAYE'].includes(occ.statut) && <IconBtn title="Déverrouiller le dossier" tone="amber" onClick={() => p.onUnlock(occ.id)}><Unlock size={16} /></IconBtn>}
                      <IconBtn title="Modifier" onClick={() => p.onEdit(occ)}><Pencil size={16} /></IconBtn>
                      <IconBtn title="Archiver" onClick={() => p.onArchive(occ.id, nom)}><Archive size={16} /></IconBtn>
                      {canModify && <IconBtn title="Supprimer" tone="rose" onClick={() => p.onDelete(occ.id, nom)}><Trash2 size={16} /></IconBtn>}
                    </>
                  )}
                  {p.view === 'ARCHIVE' && <IconBtn title="Restaurer" tone="emerald" onClick={() => p.onUnarchive(occ.id, nom)}><Archive size={16} /></IconBtn>}
                  <IconBtn title={open ? 'Replier le détail' : 'Voir le détail des articles'} tone="blue" onClick={() => p.onToggleRow(occ.id)}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</IconBtn>
                </div>
              </div>
            </div>

            {/* Sous-détail des articles tarifaires */}
            {open && (
              <div className="border-t border-[#e2e8f0] bg-slate-50/60 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Sous-détail des articles tarifaires applicables</h4>
                  {p.view === 'ACTIVE' && (
                    <button onClick={() => p.onAddLigne(occ)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"><Plus size={14} /> Ajouter un article</button>
                  )}
                </div>

                {lignes.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-2">Aucun article sur ce dossier.</p>
                ) : (
                  <div className="overflow-x-auto bg-white border border-[#e2e8f0] rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-4 py-2.5 w-12">N°</th>
                          <th className="px-4 py-2.5">Article de tarification</th>
                          <th className="px-4 py-2.5">Paramètres d&apos;assiette</th>
                          <th className="px-4 py-2.5">Zone / formule</th>
                          <th className="px-4 py-2.5 text-right">Sous-total TTC</th>
                          {p.view === 'ACTIVE' && <th className="px-4 py-2.5 w-20" />}
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((l: any, i: number) => {
                          const u = unitsOf(l);
                          const assiette = u.u2
                            ? `${l.quantite1} ${u.u1} × ${l.quantite2} ${u.u2}`
                            : `${l.quantite1} ${u.u1}`;
                          return (
                            <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">{l.article?.designation || '—'}</td>
                              <td className="px-4 py-2.5 text-blue-700 tabular-nums">{assiette}</td>
                              <td className="px-4 py-2.5">
                                {u.raw ? <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">{u.raw}</span> : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">{eur(l.montant || 0)} €</td>
                              {p.view === 'ACTIVE' && (
                                <td className="px-4 py-2.5">
                                  <div className="flex justify-end gap-1">
                                    <IconBtn title="Modifier l'article" onClick={() => p.onEditLigne(occ, l)}><Pencil size={14} /></IconBtn>
                                    <IconBtn title="Supprimer l'article" tone="rose" onClick={() => p.onDeleteLigne(occ.id, l.id)}><Trash2 size={14} /></IconBtn>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {occ.updated_at ? `Dernière révision le ${format(new Date(occ.updated_at), 'd MMMM yyyy', { locale: fr })}` : ''}
                  </p>
                  <p className="text-sm text-slate-600">
                    Total calculé :{' '}
                    <span className="ml-1 inline-block bg-white border border-[#e2e8f0] rounded-lg px-4 py-2 text-base font-bold text-slate-900 tabular-nums">{eur(totalAmount(occ))} € TTC</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>Affichage de <b className="text-slate-800 tabular-nums">{total === 0 ? 0 : start + 1} - {Math.min(start + perPage, total)}</b> sur <b className="text-slate-800 tabular-nums">{total}</b> dossier{total > 1 ? 's' : ''}</span>
          <label className="flex items-center gap-2">Afficher :
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="bg-white border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm text-slate-700">
              {[15, 25, 50, 100].map((n) => <option key={n} value={n}>{n} par page</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button disabled={current <= 1} onClick={() => setPage(current - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white disabled:opacity-40"><ChevronLeft size={14} /> Précédent</button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
            .map((n, i, arr) => (
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

const TONES: Record<string, string> = {
  slate: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
  blue: 'text-blue-600 hover:bg-blue-50',
  emerald: 'text-emerald-600 hover:bg-emerald-50',
  violet: 'text-violet-600 hover:bg-violet-50',
  amber: 'text-amber-600 hover:bg-amber-50',
  rose: 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
};

function IconBtn({ children, title, onClick, tone = 'slate' }: { children: React.ReactNode; title: string; onClick: () => void; tone?: keyof typeof TONES }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border border-transparent transition-colors ${TONES[tone]}`}>
      {children}
    </button>
  );
}
