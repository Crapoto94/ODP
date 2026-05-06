"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Store, MapPin, Mail, Phone, ShoppingCart, AlertCircle, Plus, Search, Lock, LockOpen, X } from 'lucide-react';
import { useLockedYear } from './hooks/useLockedYear';
import { getAvailableStatuses } from '@/lib/status-utils';

interface Article {
  id: number;
  nom: string;
  count: number;
}

interface Commerce {
  id: number;
  nom: string;
  adresse?: string;
  email: string;
  tlpeYears: number[];
  commerceYears: number[];
  tlpeCount: number;
  commerceCount: number;
  articles: Article[];
  etatAdministratif?: string;
  enseigneSurface?: number;
  isExonere?: boolean;
  threshold?: number;
  lastYearStatut?: string;
}

export default function CommercesPage() {
  const router = useRouter();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [streetFilter, setStreetFilter] = useState('ALL');
  const [onlyClosed, setOnlyClosed] = useState(false);
  const [sortByAddress, setSortByAddress] = useState(false);
  const { lockedYear, setLockedYear, isHydrated } = useLockedYear();

  useEffect(() => {
    if (isHydrated && lockedYear && lockedYear !== 'ALL') {
      setYearFilter(lockedYear);
    }
  }, [lockedYear, isHydrated]);

  useEffect(() => {
    fetchCommerces();
  }, [view]);

  const fetchCommerces = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/commerces?status=${view}`);
      setCommerces(res.data);
    } catch (err) {
      console.error('Failed to fetch commerces:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseAddress = (addr: string) => {
    if (!addr) return { number: 0, street: 'Sans adresse' };
    const trimAddr = addr.trim();
    
    // Find the first index where an alphabetical character appears
    const firstLetterMatch = trimAddr.match(/[a-zA-ZÀ-ÿ]/);
    if (!firstLetterMatch) return { number: 0, street: trimAddr };
    
    const index = firstLetterMatch.index!;
    const numberPart = trimAddr.substring(0, index).trim();
    const streetPart = trimAddr.substring(index).trim();
    
    // For sorting purposes, we still want a numeric value for the number part
    const numericMatch = numberPart.match(/\d+/);
    const numericNumber = numericMatch ? parseInt(numericMatch[0]) : 0;
    
    return { number: numericNumber, street: streetPart, fullNumber: numberPart };
  };

  const filteredCommerces = commerces.filter(commerce => {
    const matchesSearch = commerce.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commerce.adresse?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || commerce.lastYearStatut === statusFilter;
    
    // Check if any of the years match the filter
    const allYears = [...(commerce.tlpeYears || []), ...(commerce.commerceYears || [])].map(String);
    const matchesYear = yearFilter === 'ALL' || allYears.includes(yearFilter);

    // Street filter
    const { street } = parseAddress(commerce.adresse || '');
    const matchesStreet = streetFilter === 'ALL' || street.toLowerCase() === streetFilter.toLowerCase();

    // Filter by closed status if requested
    if (onlyClosed && !(commerce.etatAdministratif === 'Fermée' || commerce.etatAdministratif === 'Cessée')) {
      return false;
    }

    return matchesSearch && matchesStatus && matchesYear && matchesStreet;
  });

  const availableStreets = Array.from(new Set(
    commerces.map(c => parseAddress(c.adresse || '').street).filter(s => s && s !== 'Sans adresse')
  )).sort((a, b) => a.localeCompare(b));

  const sortedCommerces = [...filteredCommerces].sort((a, b) => {
    if (sortByAddress) {
      const pA = parseAddress(a.adresse || '');
      const pB = parseAddress(b.adresse || '');
      
      const sA = pA.street.toLowerCase();
      const sB = pB.street.toLowerCase();
      
      if (sA !== sB) return sA.localeCompare(sB);
      return pA.number - pB.number;
    }
    return a.nom.localeCompare(b.nom);
  });

  const availableYears = Array.from(new Set(
    commerces.flatMap(c => [...(c.tlpeYears || []), ...(c.commerceYears || [])])
  )).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des commerces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Commerces</h1>
            <div className="flex items-center gap-4 mt-1">
              <button 
                onClick={() => setView('ACTIVE')}
                className={`text-sm font-black uppercase tracking-widest ${view === 'ACTIVE' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Actifs ({view === 'ACTIVE' ? filteredCommerces.length : '...'})
              </button>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <button 
                onClick={() => setView('ARCHIVE')}
                className={`text-sm font-black uppercase tracking-widest ${view === 'ARCHIVE' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Archivés ({view === 'ARCHIVE' ? filteredCommerces.length : '...'})
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/occupations?type=COMMERCE')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau Commerce
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un commerce ou une adresse..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Year Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <select
              className="bg-transparent px-4 py-2 text-xs font-bold text-slate-500 outline-none focus:border-none transition-all cursor-pointer"
              value={lockedYear || yearFilter}
              onChange={e => {
                if (!lockedYear) {
                  setYearFilter(e.target.value);
                }
              }}
              disabled={!!lockedYear}
            >
              <option value="ALL">Toutes les années</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (lockedYear) {
                  setLockedYear(null);
                } else if (yearFilter !== 'ALL') {
                  setLockedYear(yearFilter);
                }
              }}
              disabled={yearFilter === 'ALL' && !lockedYear}
              className={`px-3 py-2.5 border-l border-slate-200 transition-all ${
                lockedYear
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : yearFilter !== 'ALL'
                  ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
              title={lockedYear ? `Déverrouiller l'année ${lockedYear}` : 'Verrouiller cette année'}
            >
              {lockedYear ? <Lock size={16} /> : <LockOpen size={16} />}
            </button>
          </div>

          {/* Status Filter */}
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les Statuts</option>
            {Object.entries(getAvailableStatuses('CHANTIER')).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          {/* Street Filter */}
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all cursor-pointer max-w-[200px]"
            value={streetFilter}
            onChange={e => setStreetFilter(e.target.value)}
          >
            <option value="ALL">Toutes les rues</option>
            {availableStreets.map(street => (
              <option key={street} value={street}>{street}</option>
            ))}
          </select>

          {/* Closed Filter Toggle */}
          <button
            onClick={() => setOnlyClosed(!onlyClosed)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              onlyClosed 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            Fermés
          </button>

          {/* Address Sort Toggle */}
          <button
            onClick={() => setSortByAddress(!sortByAddress)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              sortByAddress 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
            title="Trier par adresse"
          >
            <MapPin size={14} />
            Rue
          </button>

          {/* Reset Filters */}
          {(searchTerm || statusFilter !== 'ALL' || (yearFilter !== 'ALL' && !lockedYear) || onlyClosed || sortByAddress || streetFilter !== 'ALL') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setStreetFilter('ALL');
                if (!lockedYear) setYearFilter('ALL');
                setOnlyClosed(false);
                setSortByAddress(false);
              }}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Réinitialiser les filtres"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {sortedCommerces.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Store className="text-slate-200" size={60} />
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Aucun commerce trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedCommerces.map((commerce, index) => {
            const pCurrent = parseAddress(commerce.adresse || '');
            const pPrevious = index > 0 ? parseAddress(sortedCommerces[index-1].adresse || '') : null;
            
            const showStreetHeader = sortByAddress && (
              index === 0 || pCurrent.street.toLowerCase() !== pPrevious?.street.toLowerCase()
            );

            const getStatusBadge = (status?: string) => {
              if (!status) return null;
              let colors = 'bg-slate-100 text-slate-600 border-slate-200';
              if (status === 'FACTURE') colors = 'bg-blue-100 text-blue-700 border-blue-200';
              else if (status.includes('VALID')) colors = 'bg-emerald-100 text-emerald-700 border-emerald-200';
              else if (status.includes('VERIF')) colors = 'bg-amber-100 text-amber-700 border-amber-200';
              else if (status === 'PROVISOIRE') colors = 'bg-slate-100 text-slate-700 border-slate-200';
              
              return (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors}`}>
                  {status}
                </span>
              );
            };

            return (
              <React.Fragment key={commerce.id}>
                {showStreetHeader && (
                  <div className={`flex items-center gap-4 ${index === 0 ? 'mt-2' : 'mt-8'} mb-4`}>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                      <MapPin size={14} className="text-blue-500" />
                      {pCurrent.street}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  </div>
                )}
                <Link
                  href={`/dashboard/commerces/${commerce.id}`}
                  className="group block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 p-4"
                >
                  <div className="flex items-center justify-between gap-6">
                  {/* Left: Avatar and Name and Address */}
                  <div className="flex items-start gap-3 min-w-0" style={{ flex: '0 0 25%' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden relative">
                      <img
                        src={`https://logo.clearbit.com/${encodeURIComponent(commerce.nom.toLowerCase().trim())}.com?size=64`}
                        alt={commerce.nom}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-white font-black text-sm">
                        {commerce.nom.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {commerce.nom}
                        </h3>
                        {getStatusBadge(commerce.lastYearStatut)}
                        {(commerce.etatAdministratif === 'Fermée' || commerce.etatAdministratif === 'Cessée') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 uppercase tracking-widest shrink-0">
                            Fermé
                          </span>
                        )}
                      </div>
                      {commerce.adresse && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{commerce.adresse}</p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Dispositifs */}
                  <div className="flex-1 min-w-0">
                    {commerce.articles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                            {commerce.articles.reduce((acc: number, a: any) => acc + (a.count || 0), 0)} dispositif(s)
                          </span>
                          {commerce.enseigneSurface !== undefined && commerce.enseigneSurface > 0 && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border shadow-sm ${
                              commerce.isExonere 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {commerce.isExonere ? <AlertCircle size={12} className="text-amber-500" /> : null}
                              Enseigne : {commerce.enseigneSurface.toLocaleString('fr-FR')} m²
                              {commerce.isExonere && (
                                <span className="bg-amber-200/50 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter">
                                  Exonéré (&lt;{commerce.threshold}m²)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>

                  {/* Right: Dossiers */}
                  <div className="flex items-center gap-4 shrink-0">
                    {commerce.tlpeCount > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">TLPE</p>
                        <p className="text-sm font-black text-slate-900">
                          {commerce.tlpeCount}
                        </p>
                        {commerce.tlpeYears.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {Math.min(...commerce.tlpeYears)}–{Math.max(...commerce.tlpeYears)}
                          </p>
                        )}
                      </div>
                    )}

                    {commerce.commerceCount > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Cmce</p>
                        <p className="text-sm font-black text-slate-900">
                          {commerce.commerceCount}
                        </p>
                        {commerce.commerceYears.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {Math.min(...commerce.commerceYears)}–{Math.max(...commerce.commerceYears)}
                          </p>
                        )}
                      </div>
                    )}

                    {(commerce as any).lastYearTotal > 0 && (
                      <div className="text-right px-4 border-l border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dernier dossier</p>
                        <p className="text-sm font-black text-blue-600">
                          {(commerce as any).lastYearTotal.toLocaleString('fr-FR')}€
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                          Année {(commerce as any).lastYear}
                        </p>
                      </div>
                    )}

                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Store size={18} />
                    </div>
                  </div>
                </div>
                </Link>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
