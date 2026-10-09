"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShoppingBag, Plus, Search, Lock, LockOpen, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLockedYear } from '@/app/dashboard/commerces/hooks/useLockedYear';
import StatutPill, { normStatut } from '@/components/v2/StatutPill';
import TiersCardsV2, { type TiersCardData } from '@/components/v2/TiersCardsV2';
import { useUiMode } from '@/components/UiModeProvider';

interface YearDetail { statut: string; total: number; nbDispositifs: number }

interface TLPEDossier {
  id: number; // tiersId
  nom: string;
  code_sedit?: string | null;
  adresse?: string | null;
  years: number[];
  byYear?: Record<string, YearDetail>;
  lastYear: number;
  lastYearStatut: string;
  lastYearTotal: number;
  nbDispositifs: number;
}

// Filtre « statut » : valeurs normalisées, libellés métier (VALIDE/VERIFIE = prêt à facturer)
const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'INITIALISATION', label: 'Initialisation' },
  { value: 'INSTRUCTION', label: 'Instruction' },
  { value: 'PREPARATION_AOT', label: 'Préparation des AOT' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'VALIDE', label: 'Prêt à facturer' },
  { value: 'FACTURE', label: 'Facturé' },
  { value: 'TITRE', label: 'Titré' },
  { value: 'CLOS', label: 'Clos' },
];

export default function TLPEPage() {
  const router = useRouter();
  const uiMode = useUiMode();
  const [dossiers, setDossiers] = useState<TLPEDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { lockedYear, setLockedYear, isHydrated } = useLockedYear();

  useEffect(() => {
    fetchTLPEData();
  }, []);

  // Année verrouillée (partagée avec la page Commerces) : appliquée dès le chargement
  useEffect(() => {
    if (isHydrated && lockedYear && lockedYear !== 'ALL') setYearFilter(lockedYear);
  }, [lockedYear, isHydrated]);

  const fetchTLPEData = async () => {
    try {
      const res = await axios.get('/api/tlpe');
      setDossiers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch TLPE data:', err);
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  };

  const activeYear = lockedYear || yearFilter;

  // État / montant / dispositifs à afficher : ceux de l'année filtrée si elle est choisie, sinon ceux de la dernière année
  const detailFor = (d: TLPEDossier) => {
    if (activeYear !== 'ALL') {
      const y = d.byYear?.[activeYear];
      return y ? { year: activeYear, ...y } : null;
    }
    return { year: String(d.lastYear), statut: d.lastYearStatut, total: d.lastYearTotal, nbDispositifs: d.nbDispositifs };
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch = !term ||
      (d.nom || '').toLowerCase().includes(term) ||
      (d.code_sedit || '').toLowerCase().includes(term) ||
      (d.adresse || '').toLowerCase().includes(term);
    const detail = detailFor(d);
    const matchesYear = activeYear === 'ALL' || !!detail;
    const n = normStatut(detail?.statut);
    const matchesStatus = statusFilter === 'ALL' || n === statusFilter || (statusFilter === 'VALIDE' && n === 'VERIFIE');
    return matchesSearch && matchesYear && matchesStatus;
  });

  const availableYears = Array.from(new Set(dossiers.flatMap((d) => d.years || []))).sort((a, b) => b - a);
  const hasFilters = !!searchTerm || statusFilter !== 'ALL' || (yearFilter !== 'ALL' && !lockedYear);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-purple-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des dossiers TLPE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">T.L.P.E.</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {filteredDossiers.length} dossier{filteredDossiers.length !== 1 ? 's' : ''}
              {activeYear !== 'ALL' ? ` en ${activeYear}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/occupations?type=TLPE')}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau TLPE
        </button>
      </div>

      {/* Zone de recherche et filtres (comme la page Commerces) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, code tiers ou adresse..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all font-semibold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Année + verrou */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <select
              className="bg-transparent px-4 py-2 text-xs font-bold text-slate-500 outline-none cursor-pointer"
              value={lockedYear || yearFilter}
              onChange={(e) => { if (!lockedYear) setYearFilter(e.target.value); }}
              disabled={!!lockedYear}
            >
              <option value="ALL">Toutes les années</option>
              {availableYears.map((y) => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <button
              onClick={() => {
                if (lockedYear) setLockedYear(null);
                else if (yearFilter !== 'ALL') setLockedYear(yearFilter);
              }}
              disabled={yearFilter === 'ALL' && !lockedYear}
              className={`px-3 py-2.5 border-l border-slate-200 transition-all ${
                lockedYear
                  ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  : yearFilter !== 'ALL'
                  ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
              title={lockedYear ? `Déverrouiller l'année ${lockedYear}` : 'Verrouiller cette année'}
            >
              {lockedYear ? <Lock size={16} /> : <LockOpen size={16} />}
            </button>
          </div>

          {/* Statut */}
          <select
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none focus:border-purple-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            {STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); if (!lockedYear) setYearFilter('ALL'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {uiMode === 'v2' ? (
        <TiersCardsV2
          emptyLabel="Aucun dossier TLPE trouvé"
          cards={filteredDossiers.map((d): TiersCardData => {
            const detail = detailFor(d);
            const years = Object.entries(d.byYear || {})
              .map(([y, v]) => ({ key: `TLPE-${d.id}-${y}`, year: Number(y), type: 'TLPE' as const, statut: v.statut, total: v.total, nbDispositifs: v.nbDispositifs, href: `/dashboard/tlpe/${d.id}` }))
              .sort((a, b) => b.year - a.year);
            return {
              id: d.id,
              href: `/dashboard/tlpe/${d.id}`,
              title: d.nom,
              code: d.code_sedit,
              adresse: d.adresse,
              accent: 'purple',
              badges: detail ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border bg-violet-50 text-violet-700 border-violet-200">
                  {detail.nbDispositifs} dispositif{detail.nbDispositifs !== 1 ? 's' : ''}
                </span>
              ) : null,
              figures: detail ? [{ label: `Année ${detail.year}`, value: `${detail.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` }] : [],
              statut: detail?.statut,
              years,
            };
          })}
        />
      ) : filteredDossiers.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun dossier TLPE trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDossiers.map((dossier) => {
            const detail = detailFor(dossier)!;
            return (
              <Link
                key={dossier.id}
                href={`/dashboard/tlpe/${dossier.id}`}
                className="group block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 p-4"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-start gap-3 min-w-0" style={{ flex: '0 0 30%' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(dossier.nom || 'TLPE').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                        {dossier.nom}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {dossier.code_sedit ? `${dossier.code_sedit} — ` : ''}{dossier.adresse || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">{detail.nbDispositifs} dispositif{detail.nbDispositifs !== 1 ? 's' : ''}</span>
                    <StatutPill statut={detail.statut} />
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{detail.year}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{detail.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <ShoppingBag size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
