"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Folder, ChevronRight, Check } from 'lucide-react';

interface Category {
  id: number;
  nom: string;
  couleur?: string | null;
  niveau: number;
  parentId?: number | null;
  subs?: Category[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const PRESET_COLORS = [
  { name: 'Emeraude', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { name: 'Ambre', class: 'bg-amber-50 text-amber-700 border-amber-100' },
  { name: 'Rose', class: 'bg-rose-50 text-rose-700 border-rose-100' },
  { name: 'Bleu', class: 'bg-blue-50 text-blue-700 border-blue-100' },
  { name: 'Violet', class: 'bg-violet-50 text-violet-700 border-violet-100' },
  { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { name: 'Ardoise', class: 'bg-slate-50 text-slate-700 border-slate-100' },
];

export default function CategorieManagerModal({ isOpen, onClose, onRefresh }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCat, setNewCat] = useState({ nom: '', parentId: null as number | null, niveau: 1, couleur: '' });
  const [showColorPickerFor, setShowColorPickerFor] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.nom) return;
    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        setNewCat({ nom: '', parentId: null, niveau: 1, couleur: '' });
        fetchCategories();
        onRefresh();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateColor = async (id: number, couleur: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couleur })
      });
      if (res.ok) {
        fetchCategories();
        onRefresh();
        setShowColorPickerFor(null);
      }
    } catch (e) { console.error(e); }
  }

  if (!isOpen) return null;

  const renderCategory = (cat: Category, indent = 0) => (
    <div key={cat.id} className="space-y-2">
      <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${indent === 0 ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-slate-100'} group`} style={{ marginLeft: `${indent * 24}px` }}>
        <div className="flex items-center gap-4">
          <Folder size={18} className={indent === 0 ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="font-bold text-slate-800">{cat.nom}</span>
          {cat.couleur && (
            <span className={`px-3 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${cat.couleur}`}>
              Couleur
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Color Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowColorPickerFor(showColorPickerFor === cat.id ? null : cat.id)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-200"
              title="Changer la couleur"
            >
              <div className={`w-4 h-4 rounded-full border border-slate-200 ${cat.couleur || 'bg-slate-100'}`} />
            </button>
            
            {showColorPickerFor === cat.id && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 grid grid-cols-4 gap-2 min-w-[180px] animate-in zoom-in-95 duration-200">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.class}
                    onClick={() => handleUpdateColor(cat.id, c.class)}
                    className={`w-8 h-8 rounded-lg border border-slate-100 transition-all hover:scale-110 flex items-center justify-center ${c.class}`}
                  >
                    {cat.couleur === c.class && <Check size={12} />}
                  </button>
                ))}
                <button
                  onClick={() => handleUpdateColor(cat.id, '')}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:scale-110 flex items-center justify-center"
                  title="Réinitialiser"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {cat.niveau < 3 && (
            <button 
              onClick={() => setNewCat({ nom: '', parentId: cat.id, niveau: cat.niveau + 1, couleur: '' })}
              className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100"
            >
              <Plus size={18} />
            </button>
          )}
          <button 
            onClick={() => handleDelete(cat.id)}
            className="p-2 hover:bg-rose-50 rounded-xl transition-all text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {cat.subs?.map(sub => renderCategory(sub, indent + 1))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-slate-50 w-full max-w-2xl rounded-[3rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Catégories</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Classification des articles et tarifs</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div className="space-y-4">
            {categories.map(cat => renderCategory(cat))}
          </div>
        </div>

        {/* Create Root Category */}
        <div className="p-8 bg-white border-t border-slate-200 flex-shrink-0">
          <form onSubmit={handleAdd} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none"
                placeholder={newCat.parentId ? "Nom de la sous-catégorie..." : "Nouveau Type d'article..."}
                value={newCat.nom}
                onChange={e => setNewCat({ ...newCat, nom: e.target.value })}
              />
              {newCat.parentId && (
                <button 
                  type="button"
                  onClick={() => setNewCat({ nom: '', parentId: null, niveau: 1, couleur: '' })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                >
                  Annuler
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
