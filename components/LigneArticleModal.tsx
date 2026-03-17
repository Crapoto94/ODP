"use client";
import React, { useState, useEffect } from 'react';
import { X, Check, Save, Loader2, Calendar, Hash, Info, Euro } from 'lucide-react';
import axios from 'axios';

interface Article {
  id: number;
  numero: string | null;
  designation: string;
  montant: number;
  modeTaxation?: { nom: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ligne: any) => void;
  occupationId: number;
  annee: number;
  defaultDates: { start: string; end: string };
  initialData?: any;
}

export default function LigneArticleModal({ isOpen, onClose, onSave, occupationId, annee, defaultDates, initialData }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    articleId: '',
    quantite1: '1',
    quantite2: '1',
    dateDebut: defaultDates.start,
    dateFin: defaultDates.end
  });

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      if (initialData) {
        setFormData({
          articleId: initialData.articleId.toString(),
          quantite1: initialData.quantite1.toString(),
          quantite2: initialData.quantite2.toString(),
          dateDebut: initialData.dateDebut.split('T')[0],
          dateFin: initialData.dateFin.split('T')[0]
        });
      } else {
        setFormData({
          articleId: '',
          quantite1: '1',
          quantite2: '1',
          dateDebut: defaultDates.start,
          dateFin: defaultDates.end
        });
      }
    }
  }, [isOpen, initialData, defaultDates]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/articles?annee=${annee}`);
      setArticles(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectedArticle = articles.find(a => a.id.toString() === formData.articleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleId) return;
    
    setSaving(true);
    try {
      if (initialData?.id) {
        await axios.patch(`/api/occupations/${occupationId}/lignes/${initialData.id}`, formData);
      } else {
        await axios.post(`/api/occupations/${occupationId}/lignes`, formData);
      }
      onSave(formData);
      onClose();
    } catch (e) {
      alert("Erreur lors de l'enregistrement de l'article");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Modifier l\'article' : 'Ajouter un article'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tarifs {annee}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner l'article</label>
            <select
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm appearance-none cursor-pointer"
              value={formData.articleId}
              onChange={e => setFormData({ ...formData, articleId: e.target.value })}
            >
              <option value="">Choisir un article...</option>
              {articles.map(art => (
                <option key={art.id} value={art.id}>
                  {art.numero ? `[${art.numero}] ` : ''}{art.designation} ({art.montant}€)
                </option>
              ))}
            </select>
            {selectedArticle && (
              <div className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-bold text-blue-600 flex items-center gap-2">
                 <Euro size={12} /> {selectedArticle.montant} € {selectedArticle.modeTaxation?.nom && ` / ${selectedArticle.modeTaxation.nom}`}
              </div>
            )}
            {loading && <p className="text-[10px] font-bold text-blue-500 italic ml-1">Chargement des tarifs...</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Hash size={12} /> Quantité 1
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
                value={formData.quantite1}
                onChange={e => setFormData({ ...formData, quantite1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Hash size={12} /> Quantité 2
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
                value={formData.quantite2}
                onChange={e => setFormData({ ...formData, quantite2: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={12} /> Début
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.dateDebut}
                onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={12} /> Fin
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.dateFin}
                onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !formData.articleId}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initialData ? 'Mettre à jour' : 'Ajouter au dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
