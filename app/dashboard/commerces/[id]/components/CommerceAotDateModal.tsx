import React, { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => Promise<void>;
  isLoading: boolean;
  aotPreviewUrl?: string;
}

export default function CommerceAotDateModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  aotPreviewUrl
}: Props) {
  const [aotDate, setAotDate] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!aotDate) {
      setError('Veuillez sélectionner une date');
      return;
    }

    try {
      await onConfirm(aotDate);
      setAotDate('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la confirmation');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Date de l'AOT</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AOT déjà signé — Indiquez la date de signature</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* AOT Preview */}
          {aotPreviewUrl && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aperçu de l'AOT</label>
              <div className="border-2 border-slate-200 rounded-2xl p-4 bg-slate-50 max-h-[300px] overflow-y-auto">
                {aotPreviewUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <p className="text-sm font-bold">📄 Document PDF</p>
                  </div>
                ) : (
                  <img
                    src={aotPreviewUrl}
                    alt="AOT Preview"
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Date Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de signature de l'AOT</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-4 top-4 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                required
                type="date"
                value={aotDate}
                onChange={(e) => {
                  setAotDate(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            {aotDate && (
              <p className="text-[10px] text-slate-500 ml-1">
                {new Date(aotDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl">
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!aotDate || isLoading}
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                Confirmer la date et enregistrer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
