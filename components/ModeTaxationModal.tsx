"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';

interface ModeTaxation {
  id: number;
  nom: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ModeTaxationModal({ isOpen, onClose, onUpdate }: Props) {
  const [modes, setModes] = useState<ModeTaxation[]>([]);
  const [newMode, setNewMode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchModes();
  }, [isOpen]);

  const fetchModes = async () => {
    const res = await fetch('/api/modes-taxation');
    const data = await res.json();
    setModes(data);
  };

  const handleAdd = async () => {
    if (!newMode.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/modes-taxation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newMode.trim() })
      });
      setNewMode('');
      fetchModes();
      onUpdate();
    } catch (error) {
      console.error('Error adding mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Modes de Taxation</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Nouveau mode (ex: Par m², Forfaitaire...)"
                value={newMode}
                onChange={(e) => setNewMode(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 pl-6 pr-4 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none"
              />
              <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">
                Astuce : Utilisez le format <span className="text-indigo-600">/UNITE1/UNITE2</span> (ex: /M/MOIS) pour décomposer les variables de saisie.
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
            {modes.map(mode => {
              const parts = mode.nom.includes('/') ? mode.nom.split('/').filter(p => p.trim() !== '') : [];
              return (
                <div key={mode.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-700 text-sm uppercase tracking-wider">{mode.nom}</span>
                    {parts.length > 0 && (
                      <div className="flex gap-2">
                        {parts.map((p, i) => (
                          <span key={i} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Var {i+1}: {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
