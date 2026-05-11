import React, { useState, useEffect } from 'react';
import { Search, X, Building2, MapPin, Hash, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tiers: any) => void;
  currentTiersId?: number;
}

export default function TiersSearchModal({ isOpen, onClose, onSelect, currentTiersId }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleSearch('');
    } else {
      setSearch('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tiers');
      const allTiers = res.data || [];
      
      const filtered = allTiers.filter((t: any) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          t.nom?.toLowerCase().includes(q) ||
          t.siret?.includes(q) ||
          t.adresse?.toLowerCase().includes(q) ||
          t.code_sedit?.toLowerCase().includes(q)
        );
      });
      
      setResults(filtered.slice(0, 50));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Changer le tiers de facturation</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recherchez par nom, SIRET, adresse ou code SEDIT</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              autoFocus
              type="text"
              placeholder="Commencez à taper pour rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && results.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recherche en cours...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center">
              <Building2 size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400 italic">Aucun tiers trouvé pour "{search}"</p>
            </div>
          ) : (
            results.map(t => {
              const isClosed = t.etatAdministratif === 'Cessée';
              return (
              <button
                key={t.id}
                onClick={() => {
                  if (isClosed && currentTiersId !== t.id) {
                    if (!confirm(`Attention: Ce tiers est fermé. Êtes-vous sûr de vouloir le sélectionner comme tiers de facturation?`)) {
                      return;
                    }
                  }
                  onSelect(t);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  currentTiersId === t.id
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20'
                  : isClosed
                  ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                  : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentTiersId === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900 truncate">{t.nom}</p>
                      {t.etatAdministratif === 'Cessée' && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded whitespace-nowrap">
                          <AlertCircle size={10} /> Fermé
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {t.code_sedit && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Hash size={10} /> {t.code_sedit}
                        </div>
                      )}
                      {t.siret && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          SIRET: {t.siret}
                        </div>
                      )}
                      {t.adresse && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 truncate max-w-[200px]">
                          <MapPin size={10} /> {t.adresse}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {currentTiersId === t.id ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check size={14} />
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">
                    Sélectionner
                  </div>
                )}
              </button>
            );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
