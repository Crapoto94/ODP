"use client";
import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  annee: number;
  initialData?: any; // For editing
}

export default function TarifEditModal({ isOpen, onClose, onSave, annee, initialData }: Props) {
  const [articles, setArticles] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewArticle, setIsNewArticle] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    articleId: '',
    numero: '',
    designation: '',
    categorieId: '',
    modeTaxationId: '',
    montant: '',
    notes: '',
    annee: annee
  });

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      fetchModes();
      fetchCategories();
      
      if (initialData) {
        setFormData({
          id: initialData.id,
          articleId: initialData.articleId.toString(),
          numero: initialData.article?.numero || '',
          designation: initialData.article?.designation || '',
          categorieId: initialData.article?.categorieId?.toString() || '',
          modeTaxationId: initialData.modeTaxationId?.toString() || '',
          montant: initialData.montant.toString(),
          notes: initialData.notes || '',
          annee: initialData.annee
        });
        setIsNewArticle(false);
      } else {
        setFormData({
          id: null,
          articleId: '',
          numero: '',
          designation: '',
          categorieId: '',
          modeTaxationId: '',
          montant: '',
          notes: '',
          annee: annee
        });
        setIsNewArticle(true);
      }
    }
  }, [isOpen, annee, initialData]);

  const fetchArticles = async () => {
    try {
      const res = await fetch(`/api/articles?annee=${annee}`);
      const data = await res.json();
      setArticles(data);
    } catch (e) { console.error(e); }
  };

  const fetchModes = async () => {
    try {
      const res = await fetch('/api/modes-taxation');
      const data = await res.json();
      setModes(data);
    } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const flat: any[] = [];
      const traverse = (cats: any[], prefix = '') => {
        cats.forEach(c => {
          flat.push({ ...c, displayName: prefix + c.nom });
          if (c.subs) traverse(c.subs, prefix + '\u00A0\u00A0\u00A0');
        });
      };
      traverse(data);
      setCategories(flat);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.montant || isNaN(parseFloat(formData.montant))) {
      alert("Veuillez saisir un montant valide.");
      return;
    }
    if (isNewArticle && (!formData.designation || !formData.categorieId)) {
      alert("Veuillez saisir une désignation et choisir une catégorie.");
      return;
    }
    if (!isNewArticle && !formData.articleId) {
      alert("Veuillez choisir un article.");
      return;
    }

    setLoading(true);
    try {
      const url = formData.id ? `/api/tarifs/${formData.id}` : '/api/tarifs';
      const method = formData.id ? 'PATCH' : 'POST';
      
      const body = {
        ...formData,
        articleId: isNewArticle ? null : parseInt(formData.articleId),
        designation: isNewArticle ? formData.designation : null,
        categorieId: isNewArticle ? parseInt(formData.categorieId) : null,
        modeTaxationId: formData.modeTaxationId ? parseInt(formData.modeTaxationId) : null,
        montant: parseFloat(formData.montant)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error('Error saving tariff:', error);
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {formData.id ? 'Modifier Tarif' : 'Nouveau Tarif'} <span className="text-indigo-600">{annee}</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Édition des barèmes municipaux</p>
            </div>
            <button type="button" onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar flex-1">
            {!formData.id && (
              <div className="flex bg-slate-100 p-1 rounded-[1.2rem] border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewArticle(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${isNewArticle ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Nouvel Article
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewArticle(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${!isNewArticle ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Article Existant
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Référence / N° Article</label>
                <input
                  className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none"
                  placeholder="Ex: 501.1..."
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>

              {isNewArticle ? (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Désignation de l'article</label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none"
                      placeholder="Ex: Occupation domaine public pour travaux..."
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Catégorie</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.categorieId}
                        onChange={(e) => setFormData({ ...formData, categorieId: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Sélectionner une catégorie...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.displayName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Choisir l'Article</label>
                  <div className="relative">
                    <select
                      required
                      disabled={!!formData.id}
                      value={formData.articleId}
                      onChange={(e) => {
                        const art = articles.find(a => a.id.toString() === e.target.value);
                        setFormData({ 
                          ...formData, 
                          articleId: e.target.value,
                          numero: art?.numero || '',
                          designation: art?.designation || '',
                          categorieId: art?.categorieId?.toString() || ''
                        });
                      }}
                      className="w-full bg-slate-100 border-2 border-slate-200 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-75"
                    >
                      <option value="">Sélectionner dans la liste...</option>
                      {articles.map(art => (
                        <option key={art.id} value={art.id}>{art.numero ? `[${art.numero}] ` : ''}{art.designation}</option>
                      ))}
                    </select>
                    {!formData.id && <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mode de Taxation</label>
                <div className="relative">
                  <select
                    required
                    value={formData.modeTaxationId}
                    onChange={(e) => setFormData({ ...formData, modeTaxationId: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Choisir un mode...</option>
                    {modes.map(m => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Montant (€)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Notes / Précisions</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl font-bold focus:border-indigo-500 transition-all outline-none min-h-[100px] resize-none"
                  placeholder="Précisions sur l'application de ce tarif..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-indigo-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {formData.id ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
