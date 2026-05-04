"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Store, MapPin, Mail, Phone, ShoppingCart, AlertCircle, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
}

interface Tiers {
  id: number;
  nom: string;
}

export default function CommercesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [selectedTiersId, setSelectedTiersId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCommerces();
    fetchTiers();
  }, []);

  const fetchCommerces = async () => {
    try {
      const res = await axios.get('/api/commerces');
      setCommerces(res.data);
    } catch (err) {
      console.error('Failed to fetch commerces:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await axios.get('/api/tiers');
      setTiers(res.data);
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
    }
  };

  const handleCreateCommerce = async () => {
    if (!selectedTiersId) return;
    try {
      setIsSubmitting(true);
      await axios.post('/api/occupations', {
        tiersId: selectedTiersId,
        type: 'COMMERCE',
        anneeTaxation: selectedYear
      });
      setIsModalOpen(false);
      setSelectedTiersId('');
      setSelectedYear(new Date().getFullYear());
      fetchCommerces();
    } catch (err) {
      console.error('Failed to create commerce:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCommerces = commerces.filter(commerce =>
    commerce.commerceCount > 0 && (
      commerce.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commerce.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
            <p className="text-sm font-medium text-slate-500 mt-1">{filteredCommerces.length} commerce{filteredCommerces.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau Commerce
        </button>
      </div>

      <div className="relative group/search">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-slate-600/10 rounded-xl blur-xl opacity-25 group-hover/search:opacity-50 transition duration-1000"></div>
        <div className="relative bg-white/70 backdrop-blur-md rounded-xl border border-white/40 p-4 shadow-xl shadow-slate-200/40">
          <input
            type="text"
            placeholder="Rechercher un commerce..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {filteredCommerces.length === 0 ? (
        <div className="text-center py-20">
          <Store size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun commerce trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCommerces.map((commerce) => {
            const minYear = Math.min(
              ...[...commerce.tlpeYears, ...commerce.commerceYears].filter(y => y)
            );
            const maxYear = Math.max(
              ...[...commerce.tlpeYears, ...commerce.commerceYears].filter(y => y)
            );
            const totalCount = commerce.tlpeCount + commerce.commerceCount;

            return (
              <Link
                key={commerce.id}
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
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {commerce.nom}
                    </h3>
                    {commerce.adresse && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{commerce.adresse}</p>
                    )}
                  </div>
                </div>

                {/* Middle: Dispositifs */}
                <div className="flex-1 min-w-0">
                  {commerce.articles.length > 0 ? (
                    <div className="space-y-1">
                      <div className="space-y-1">
                        {commerce.articles.slice(0, 4).map((article) => (
                          <div
                            key={article.id}
                            className="flex items-center gap-2"
                          >
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                              {article.count || 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 truncate">
                              {article.nom}
                            </span>
                          </div>
                        ))}
                        {commerce.articles.length > 4 && (
                          <div className="text-xs font-bold text-slate-700">
                            +{commerce.articles.length - 4} autres
                          </div>
                        )}
                      </div>
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

                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Store size={18} />
                  </div>
                </div>
              </div>
              </Link>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Nouveau Commerce</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tiers</label>
                <select
                  value={selectedTiersId}
                  onChange={(e) => setSelectedTiersId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un tiers...</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Année de taxation</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCommerce}
                disabled={!selectedTiersId || isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
