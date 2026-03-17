"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit3,
  Pencil,
  Trash2, 
  ArrowUpDown, 
  ChevronRight, 
  Filter, 
  Loader2,
  X,
  CheckCircle2,
  Info,
  Maximize2,
  Euro,
  Calendar,
  Tag,
  Hash,
  Layers,
  Palette,
  Settings2,
  RefreshCw
} from 'lucide-react';
import CategorieManagerModal from '@/components/CategorieManagerModal';
import ImportTarifModal from '@/components/ImportTarifModal';

interface Categorie {
  id: number;
  nom: string;
  couleur: string | null;
  niveau: number;
  parentId: number | null;
  parent?: Categorie;
}

interface Article {
  id: number;
  numero: string | null;
  designation: string;
  categorieId: number | null;
  categorie: Categorie | null;
  modeTaxationId: number | null;
  modeTaxation: { id: number; nom: string } | null;
  annee: number;
  montant: number;
  notes: string | null;
}

interface ModeTaxation {
  id: number;
  nom: string;
}

export default function TarifsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [modesTaxation, setModesTaxation] = useState<ModeTaxation[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    id: null as number | null,
    numero: '',
    designation: '',
    categorieId: '',
    modeTaxationId: '',
    annee: new Date().getFullYear().toString(),
    montant: '',
    notes: ''
  });

  const isEditing = !!formData.id;

  const fetchData = async () => {
    try {
      const [artRes, catRes, modeRes, allArtRes] = await Promise.all([
        axios.get(`/api/articles?annee=${selectedYear}`),
        axios.get('/api/categories'),
        axios.get('/api/modes-taxation'),
        axios.get('/api/articles') // Fetch all to get available years
      ]);
      setArticles(artRes.data);
      setCategories(catRes.data);
      setModesTaxation(modeRes.data);
      
      const years = Array.from(new Set([
        new Date().getFullYear(),
        ...allArtRes.data.map((a: Article) => a.annee)
      ])).sort((a, b) => b - a);
      setAvailableYears(years as number[]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/articles', {
        ...formData,
        montant: parseFloat(formData.montant) || 0,
        annee: parseInt(formData.annee)
      });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`Supprimer l'article "${desc}" ?`)) return;
    try {
      await axios.delete(`/api/articles?id=${id}`);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      numero: '',
      designation: '',
      categorieId: '',
      modeTaxationId: '',
      annee: selectedYear.toString(),
      montant: '',
      notes: ''
    });
  };

  const handleEdit = (art: Article) => {
    setFormData({
      id: art.id,
      numero: art.numero || '',
      designation: art.designation,
      categorieId: art.categorieId?.toString() || '',
      modeTaxationId: art.modeTaxationId?.toString() || '',
      annee: art.annee.toString(),
      montant: art.montant.toString(),
      notes: art.notes || ''
    });
    setIsModalOpen(true);
  };

  const getCatColor = (cat: Categorie | null) => {
    if (!cat) return '#94a3b8';
    if (cat.couleur) return cat.couleur;
    if (cat.parent?.couleur) return cat.parent.couleur;
    return '#3b82f6'; // Default blue
  };

  const filtered = articles.filter(a => 
    a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.categorie?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight tracking-tighter">Référentiel Tarification</h2>
          <p className="text-slate-500 font-medium tracking-wide">Gestion des articles, désignations et montants annuels</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none font-black text-xs uppercase tracking-widest text-slate-900 pr-4 cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>Année {year}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <RefreshCw size={18} className="text-emerald-500" />
            Importer Excel
          </button>
          <button 
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <Palette size={18} className="text-blue-500" />
            Catégories
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Nouvel Article
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10 gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un article, un n° ou une catégorie..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {[2023, 2024, 2025].map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${selectedYear === year ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button className="p-3.5 rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Calcul des tarifs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 italic uppercase text-[10px] tracking-widest">
              Aucun article pour {selectedYear}
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                  <th className="px-6 pb-4">Article & N°</th>
                  <th className="px-6 pb-4">Catégorie</th>
                  <th className="px-6 pb-4">Montant Unit.</th>
                  <th className="px-6 pb-4">Mode Taxation</th>
                  <th className="px-6 pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((art) => (
                  <tr key={art.id} className="group transition-all hover:-translate-y-1">
                    <td className="px-6 py-5 rounded-l-3xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200 relative overflow-hidden">
                       <div 
                         className="absolute left-0 top-0 bottom-0 w-1 opacity-40 group-hover:opacity-100 transition-opacity" 
                         style={{ backgroundColor: getCatColor(art.categorie) }}
                       />
                       <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                           {art.numero || '#'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight mb-1">{art.designation}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Année {art.annee}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 italic font-bold">
                       <span 
                         className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-slate-50 border border-slate-100"
                         style={{ color: getCatColor(art.categorie), borderColor: `${getCatColor(art.categorie)}22` }}
                       >
                         {art.categorie?.nom || 'Non classé'}
                       </span>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                       <div className="flex items-center gap-2 text-blue-600 font-black">
                          <Euro size={14} />
                          <span>{art.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                       <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                         {art.modeTaxation?.nom || '-'}
                       </span>
                    </td>
                    <td className="px-6 py-5 rounded-r-3xl border-y border-r border-slate-100 bg-white text-right group-hover:border-blue-200">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(art)}
                          className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(art.id, art.designation)}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ARTICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <Euro size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isEditing ? 'Modifier l\'Article' : 'Nouvel Article Tarifaire'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest text-[10px] font-black">
                    Année {formData.annee}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Hash size={12} /> N° d'article
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Ex: 01.02.03..."
                      value={formData.numero}
                      onChange={e => setFormData({...formData, numero: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Tag size={12} /> Désignation complète
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Ex: Occupation terrasse..."
                      value={formData.designation}
                      onChange={e => setFormData({...formData, designation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Layers size={12} /> Catégorie (Arborescence)
                    </label>
                    <select 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                      value={formData.categorieId}
                      onChange={e => setFormData({...formData, categorieId: e.target.value})}
                    >
                      <option value="">Choisir une catégorie...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {'  '.repeat(cat.niveau - 1)} {cat.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Settings2 size={12} /> Unité de calcul (Mode)
                    </label>
                    <select 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                      value={formData.modeTaxationId}
                      onChange={e => setFormData({...formData, modeTaxationId: e.target.value})}
                    >
                      <option value="">Choisir un mode...</option>
                      {modesTaxation.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-8 bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2 text-lg">
                      Montant Brut (€)
                    </label>
                    <div className="relative">
                       <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
                       <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full bg-white border border-blue-200 rounded-2xl py-6 pl-14 pr-4 outline-none focus:border-blue-600 transition-all font-black text-2xl text-blue-700"
                        placeholder="0.00"
                        value={formData.montant}
                        onChange={e => setFormData({...formData, montant: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right flex flex-col justify-end">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Résumé de taxation</p>
                     <p className="text-sm font-bold text-blue-900 leading-tight">
                        Appliqué pour l'année {formData.annee}<br/>
                        selon le mode sélectionné.
                     </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {isEditing ? 'Enregistrer les modifications' : 'Créer l\'Article & Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCatModalOpen && (
        <CategorieManagerModal 
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          onRefresh={fetchData}
        />
      )}
      {isImportModalOpen && (
        <ImportTarifModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
