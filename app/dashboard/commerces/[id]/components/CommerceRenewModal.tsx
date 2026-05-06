import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tiersId: number;
  currentYear: number;
  occupations: any[];
}

export default function CommerceRenewModal({ isOpen, onClose, onSuccess, tiersId, currentYear, occupations }: Props) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [targetArticles, setTargetArticles] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [targetYear, setTargetYear] = useState(currentYear + 1);

  // Get unique devices (lines) from the current year
  const currentLines = occupations
    .filter((o: any) => o.anneeTaxation === currentYear)
    .flatMap((o: any) => o.lignes || [])
    .filter((l: any) => !l.deletedAt);

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    }
  }, [isOpen, targetYear]);

  const checkAvailability = async () => {
    setChecking(true);
    setError(null);
    try {
      // Fetch articles for the target year to check matching
      const res = await axios.get(`/api/articles?annee=${targetYear}`);
      setTargetArticles(res.data);
      
      // Select all by default if they have a match AND are not "deleted" (end date before 31/12)
      const initiallySelected = currentLines
        .filter(l => {
          const hasMatch = res.data.some((a: any) => a.designation === l.article?.designation);
          if (!hasMatch) return false;
          
          if (!l.dateFin) return true;
          const d2 = new Date(l.dateFin);
          const isDec31 = d2.getUTCMonth() === 11 && d2.getUTCDate() === 31;
          return isDec31;
        })
        .map(l => l.id);
      setSelectedDevices(initiallySelected);
    } catch (err) {
      console.error('Error checking articles:', err);
      setError("Erreur lors de la vérification des tarifs de l'année " + targetYear);
    } finally {
      setChecking(false);
    }
  };

  const getMatch = (designation: string) => {
    return targetArticles.find(a => a.designation === designation);
  };

  const handleToggle = (id: number) => {
    setSelectedDevices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRenew = async () => {
    if (selectedDevices.length === 0) return;
    
    setLoading(true);
    try {
      await axios.post(`/api/commerces/${tiersId}/renew`, {
        fromYear: currentYear,
        toYear: targetYear,
        lineIds: selectedDevices
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la reconduction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Reconduire vers 
              <input 
                type="number" 
                value={targetYear} 
                onChange={(e) => setTargetYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-24 px-2 py-1 text-xl font-black bg-white border border-slate-200 rounded-lg text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Transfert des dispositifs de {currentYear}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {checking ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-bold text-slate-500">Vérification des tarifs {targetYear}...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800 font-medium">
                  Sélectionnez les dispositifs à reconduire pour l'année {targetYear}. 
                  Les dates seront automatiquement fixées du 01/01 au 31/12.
                </p>
              </div>

              <div className="space-y-3">
                {currentLines.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-medium italic">Aucun dispositif trouvé pour {currentYear}</p>
                ) : (
                  currentLines.map((ligne: any) => {
                    const match = getMatch(ligne.article?.designation);
                    const isSelectable = !!match;
                    
                    const d2 = ligne.dateFin ? new Date(ligne.dateFin) : null;
                    const isSupprime = d2 && !(d2.getUTCMonth() === 11 && d2.getUTCDate() === 31);

                    return (
                      <div 
                        key={ligne.id}
                        onClick={() => isSelectable && handleToggle(ligne.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedDevices.includes(ligne.id)
                            ? 'border-blue-500 bg-blue-50'
                            : isSelectable 
                              ? 'border-slate-100 hover:border-slate-200 bg-white' 
                              : 'border-slate-100 bg-slate-50 opacity-80 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 truncate">{ligne.article?.designation}</p>
                              {isSupprime && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-tighter shrink-0">
                                  Supprimé au {d2.toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Quantité: {ligne.quantite1} {ligne.article?.modeTaxation?.nom}
                            </p>
                            {!isSelectable && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-2 py-0.5 rounded w-fit">
                                <AlertTriangle size={10} />
                                Tarif non trouvé en {targetYear}
                              </div>
                            )}
                          </div>
                          {isSelectable && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              selectedDevices.includes(ligne.id) ? 'bg-blue-600 text-white' : 'bg-slate-200'
                            }`}>
                              {selectedDevices.includes(ligne.id) && <CheckCircle2 size={16} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleRenew}
            disabled={loading || selectedDevices.length === 0 || checking}
            className="flex-[2] px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Confirmer la reconduction
          </button>
        </div>
      </div>
    </div>
  );
}
