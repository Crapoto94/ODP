"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShoppingBag, X, Plus } from 'lucide-react';
import Link from 'next/link';

interface TLPEDossier {
  id: number;
  numero?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  adresse?: string;
  tiers?: {
    nom: string;
    prenom?: string;
    adresse?: string;
  };
}

interface Tiers {
  id: number;
  nom: string;
}

export default function TLPEPage() {
  const [dossiers, setDossiers] = useState<TLPEDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [selectedTiersId, setSelectedTiersId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTLPEData();
    fetchTiers();
  }, []);

  const fetchTLPEData = async () => {
    try {
      const res = await axios.get('/api/occupations?type=TLPE');
      setDossiers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch TLPE data:', err);
      setDossiers([]);
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

  const handleCreateTLPE = async () => {
    if (!selectedTiersId) return;
    try {
      setIsSubmitting(true);
      await axios.post('/api/occupations', {
        tiersId: selectedTiersId,
        type: 'TLPE',
        anneeTaxation: selectedYear
      });
      setIsModalOpen(false);
      setSelectedTiersId('');
      setSelectedYear(new Date().getFullYear());
      fetchTLPEData();
    } catch (err) {
      console.error('Failed to create TLPE:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDossiers = dossiers.filter((dossier) =>
    dossier.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dossier.tiers?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-sm font-medium text-slate-500 mt-1">{filteredDossiers.length} dossier{filteredDossiers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau TLPE
        </button>
      </div>

      <div className="relative group/search">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur-xl opacity-25 group-hover/search:opacity-50 transition duration-1000"></div>
        <div className="relative bg-white/70 backdrop-blur-md rounded-xl border border-white/40 p-4 shadow-xl shadow-slate-200/40">
          <input
            type="text"
            placeholder="Rechercher un dossier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {filteredDossiers.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun dossier TLPE trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/dashboard/occupations/${dossier.id}`}
              className="group block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 p-4"
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-3 min-w-0" style={{ flex: '0 0 25%' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {(dossier.tiers?.nom || 'TLPE').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                      {dossier.tiers?.prenom && `${dossier.tiers.prenom} `}{dossier.tiers?.nom}
                    </h3>
                    {dossier.adresse && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dossier.adresse}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{dossier.statut || '—'}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {dossier.dateDebut && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Période</p>
                      <p className="text-xs text-slate-500">
                        {new Date(dossier.dateDebut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Nouveau TLPE</h2>
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                onClick={handleCreateTLPE}
                disabled={!selectedTiersId || isSubmitting}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
