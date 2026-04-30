"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Store, MapPin, Mail, Phone, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: number;
  nom: string;
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

export default function CommercesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCommerces();
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

  const filteredCommerces = commerces.filter(commerce =>
    commerce.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commerce.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Commerces</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">{filteredCommerces.length} commerce{filteredCommerces.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
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
                href={`/dashboard/tiers/${commerce.id}`}
                className="group block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 p-4"
              >
                <div className="flex items-center justify-between gap-6">
                {/* Left: Name and Address */}
                <div className="min-w-0" style={{ flex: '0 0 25%' }}>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {commerce.nom}
                  </h3>
                  {commerce.adresse && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{commerce.adresse}</p>
                  )}
                </div>

                {/* Middle: Dispositifs */}
                <div className="flex-1 min-w-0">
                  {commerce.articles.length > 0 ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-slate-100 text-slate-700">
                        {commerce.articles.length}
                      </span>
                      <div className="space-y-1">
                        {commerce.articles.slice(0, 4).map((article) => (
                          <div
                            key={article.id}
                            className="text-xs font-bold text-slate-700 truncate"
                          >
                            {article.nom}
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
    </div>
  );
}
