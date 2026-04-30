"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Store, MapPin, Mail, Phone, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface Commerce {
  id: number;
  nom: string;
  adresse?: string;
  email: string;
  codePostal?: string;
  ville?: string;
  occupationCount: number;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCommerces.map((commerce) => (
            <Link
              key={commerce.id}
              href={`/dashboard/tiers/${commerce.id}`}
              className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {commerce.nom}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-blue-600 font-bold text-sm">
                      <ShoppingCart size={14} />
                      {commerce.occupationCount} dossier{commerce.occupationCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Store size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  {commerce.adresse && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-600">
                        {commerce.adresse}
                        {commerce.codePostal && ` - ${commerce.codePostal} ${commerce.ville || ''}`}
                      </span>
                    </div>
                  )}
                  {commerce.email && (
                    <div className="flex items-start gap-3 text-sm">
                      <Mail size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-600 break-all">{commerce.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
