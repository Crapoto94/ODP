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
  RefreshCw,
  Box,
  Car,
  Film,
  Wind,
  PlusCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import CategorieManagerModal from '@/components/CategorieManagerModal';
import ImportTarifModal from '@/components/ImportTarifModal';
import ModeTaxationModal from '@/components/ModeTaxationModal';
import TlpeTarifsModal from '@/components/TlpeTarifsModal';
import OdpDocsBanner from '@/components/OdpDocsBanner';
import OdpDocsModal from '@/components/OdpDocsModal';
import { useLockedYear } from '@/app/dashboard/occupations/hooks/useLockedYear';

interface Categorie {
  id: number;
  nom: string;
  couleur: string | null;
  niveau: number;
  parentId: number | null;
  parent?: Categorie;
  subs?: Categorie[];
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
  chapitre?: string;
  nature?: string;
  fonction?: string;
  codeInterne?: string;
  typeMouvement?: string;
  sens?: string;
  structure?: string;
  gestionnaire?: string;
}

interface ModeTaxation {
  id: number;
  nom: string;
}

export default function TarifsPage() {
  const { lockedYear, isHydrated } = useLockedYear();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [modesTaxation, setModesTaxation] = useState<ModeTaxation[]>([]);
  const [tlpeConfig, setTlpeConfig] = useState<any>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isTlpeModalOpen, setIsTlpeModalOpen] = useState(false);
  const [isOdpModalOpen, setIsOdpModalOpen] = useState(false);
  const [odpConfig, setOdpConfig] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // When locked year changes, update selected year to match
  useEffect(() => {
    if (isHydrated && lockedYear) {
      setSelectedYear(parseInt(lockedYear));
    }
  }, [lockedYear, isHydrated]);

  const [formData, setFormData] = useState({
    id: null as number | null,
    numero: '',
    designation: '',
    categorieId: '',
    modeTaxationId: '',
    annee: new Date().getFullYear().toString(),
    montant: '',
    notes: '',
    chapitre: '',
    nature: '',
    fonction: '',
    codeInterne: '',
    typeMouvement: '',
    sens: '',
    structure: '',
    gestionnaire: ''
  });

  const isEditing = !!formData.id;

  const fetchData = async () => {
    try {
      const [artRes, catRes, modeRes, allArtRes, tlpeRes, odpRes] = await Promise.all([
        axios.get(`/api/articles?annee=${selectedYear}`),
        axios.get('/api/categories'),
        axios.get('/api/modes-taxation'),
        axios.get('/api/articles'), // Fetch all to get available years
        axios.get(`/api/articles/tlpe?annee=${selectedYear}`).catch(() => ({ data: { config: null, configs: [] } })),
        axios.get(`/api/settings/odp-docs?annee=${selectedYear}`).catch(() => ({ data: { config: null, configs: [] } }))
      ]);
      setArticles(artRes.data);
      setCategories(catRes.data);
      setModesTaxation(modeRes.data);
      setTlpeConfig(tlpeRes.data?.config || null);
      setOdpConfig(odpRes.data?.config || null);

      const years = Array.from(new Set([
        new Date().getFullYear(),
        ...allArtRes.data.map((a: Article) => a.annee),
        ...(tlpeRes.data?.configs || []).map((c: any) => c.annee),
        ...(odpRes.data?.configs || []).map((c: any) => c.annee)
      ])).filter(Boolean).sort((a: any, b: any) => b - a);
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

  const flattenedCategories = useMemo(() => {
    const flat: Categorie[] = [];
    const traverse = (cats: Categorie[]) => {
      cats.forEach(cat => {
        flat.push(cat);
        if (cat.subs && cat.subs.length > 0) {
          traverse(cat.subs);
        }
      });
    };
    traverse(categories);
    return flat;
  }, [categories]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

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
      notes: '',
      chapitre: '',
      nature: '',
      fonction: '',
      codeInterne: '',
      typeMouvement: '',
      sens: '',
      structure: '',
      gestionnaire: ''
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
      notes: art.notes || '',
      chapitre: art.chapitre || '',
      nature: art.nature || '',
      fonction: art.fonction || '',
      codeInterne: art.codeInterne || '',
      typeMouvement: art.typeMouvement || '',
      sens: art.sens || '',
      structure: art.structure || '',
      gestionnaire: art.gestionnaire || ''
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

  const groupedArticles = useMemo(() => {
    const groups: Record<string, Record<string, Article[]>> = {};

    filtered.forEach(art => {
      let typeName = 'Non classé';
      let subTypeName = 'Divers';

      if (art.categorie) {
        if (art.categorie.niveau === 1) {
          typeName = art.categorie.nom;
        } else if (art.categorie.niveau === 2) {
          subTypeName = art.categorie.nom;
          typeName = art.categorie.parent?.nom || 'Autre';
        } else if (art.categorie.niveau === 3) {
          subTypeName = art.categorie.parent?.nom || 'Autre';
          // Fix: Reach parent of parent (Level 1)
          typeName = (art.categorie.parent as any)?.parent?.nom || art.categorie.parent?.nom || 'Autre';
        }
      }

      if (!groups[typeName]) groups[typeName] = {};
      if (!groups[typeName][subTypeName]) groups[typeName][subTypeName] = [];
      groups[typeName][subTypeName].push(art);
    });

    // Tri par numéro d'article dans chaque sous-catégorie
    Object.keys(groups).forEach(typeName => {
      Object.keys(groups[typeName]).forEach(subTypeName => {
        groups[typeName][subTypeName].sort((a, b) => {
          const numA = a.numero ? parseFloat(a.numero) : Infinity;
          const numB = b.numero ? parseFloat(b.numero) : Infinity;
          return numA - numB;
        });
      });
    });

    return groups;
  }, [filtered]);

  const getPrimaryCategoryStyle = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('SURVOL')) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Wind size={18} />, gradient: 'from-blue-500 to-indigo-600' };
    if (n.includes('SUPERFICIELLES')) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: <Box size={18} />, gradient: 'from-orange-500 to-amber-600' };
    if (n.includes('STATIONNEMENT')) return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <Car size={18} />, gradient: 'from-emerald-500 to-teal-600' };
    if (n.includes('TOURNAGE')) return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <Film size={18} />, gradient: 'from-rose-500 to-pink-600' };
    return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: <Layers size={18} />, gradient: 'from-slate-500 to-slate-700' };
  };

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
            onClick={() => setIsTlpeModalOpen(true)}
            className="flex items-center gap-3 bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <Euro size={18} className="text-purple-600" />
            Tarifs TLPE
          </button>
          <button 
            onClick={() => setIsModeModalOpen(true)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <Settings2 size={18} className="text-indigo-500" />
            Mode de calculs
          </button>
          <button 
            onClick={() => setIsOdpModalOpen(true)}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            <FileText size={18} className="text-blue-500" />
            Docs ODP/Tournages
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {tlpeConfig && (tlpeConfig.deliberationPath || tlpeConfig.tarifsPath) && (
          <div className="bg-purple-50 border border-purple-100 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Euro size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Référentiel TLPE {selectedYear}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documents officiels associés</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {tlpeConfig.deliberationPath && (
                <a 
                  href={tlpeConfig.deliberationPath} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-all shadow-sm"
                >
                  Délibération (PDF)
                </a>
              )}
              {tlpeConfig.tarifsPath && (
                <a 
                  href={tlpeConfig.tarifsPath} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-all shadow-sm"
                >
                  Fichier Tarifs (PDF)
                </a>
              )}
              <div className="ml-4 pl-4 border-l border-purple-200">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Seuil exonération</p>
                <p className="text-sm font-black text-purple-700">{tlpeConfig.exoneration} m²</p>
              </div>
            </div>
          </div>
        )}

        <OdpDocsBanner 
          year={selectedYear} 
          config={odpConfig} 
          onEdit={() => setIsOdpModalOpen(true)}
        />
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
            {/* Year selector and Filter removed as per user request */}
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
                {Object.entries(groupedArticles).map(([typeName, subGroups]) => {
                  const l1Key = `L1-${typeName}`;
                  const isL1Expanded = expandedGroups.includes(l1Key);
                  const totalInGroup = Object.values(subGroups).reduce((acc, g) => acc + g.length, 0);

                  return (
                    <React.Fragment key={typeName}>
                      {/* LEVEL 1: MAIN TYPE */}
                      <tr 
                        className="bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors" 
                        onClick={() => toggleGroup(l1Key)}
                      >
                        <td colSpan={5} className="px-6 py-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {(() => {
                                const style = getPrimaryCategoryStyle(typeName);
                                return (
                                  <>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${style.bg} ${style.color} group-hover:scale-110 transition-transform ${isL1Expanded ? 'bg-gradient-to-br ' + style.gradient + ' text-white' : 'bg-white border ' + style.border}`}>
                                      {style.icon}
                                    </div>
                                    <div>
                                      <h4 className={`text-base font-black uppercase tracking-tight transition-colors ${isL1Expanded ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {typeName}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isL1Expanded ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalInGroup} articles référencés</span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 shadow-sm transition-all duration-300 ${isL1Expanded ? 'rotate-180 bg-slate-900 border-slate-900 text-white' : 'text-slate-400'}`}>
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* LEVEL 2: SUB-TYPES */}
                      {isL1Expanded && Object.entries(subGroups).map(([subTypeName, groupArticles]) => {
                        const l2Key = `L2-${typeName}-${subTypeName}`;
                        const isL2Expanded = expandedGroups.includes(l2Key);

                        return (
                          <React.Fragment key={subTypeName}>
                            <tr 
                              className="bg-white cursor-pointer hover:bg-slate-50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-400"
                              onClick={() => toggleGroup(l2Key)}
                            >
                              <td colSpan={5} className="px-10 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform duration-300 ${isL2Expanded ? 'rotate-90 text-blue-500' : 'text-slate-300'}`}>
                                      <ChevronRight size={16} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isL2Expanded ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {subTypeName}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 border border-slate-100 rounded ml-1">
                                      {groupArticles.length} items
                                    </span>
                                  </div>
                                  <div className="h-px flex-1 bg-slate-50 mx-4 opacity-50" />
                                </div>
                              </td>
                            </tr>

                            {/* ARTICLES */}
                            {isL2Expanded && groupArticles.map((art) => (
                              <tr key={art.id} className="group transition-all hover:-translate-x-1">
                                <td className="px-14 py-4 rounded-l-3xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200 relative overflow-hidden">
                                   <div 
                                     className="absolute left-0 top-0 bottom-0 w-1 opacity-40 group-hover:opacity-100 transition-opacity" 
                                     style={{ backgroundColor: getCatColor(art.categorie) }}
                                   />
                                   <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                       {art.numero || '#'}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 leading-tight mb-1">{art.designation}</p>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">Article {art.numero}</p>
                                    </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 bg-white group-hover:border-blue-200">
                                   <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                     {art.categorie?.nom || 'Sans catégorie'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 bg-white group-hover:border-blue-200">
                                   <div className="flex flex-col">
                                     <span className="text-sm font-black text-slate-900">{art.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 bg-white group-hover:border-blue-200">
                                   <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-blue-400" />
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{art.modeTaxation?.nom || 'U/M²'}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 rounded-r-3xl border-y border-r border-slate-100 bg-white group-hover:border-blue-200 text-right">
                                   <div className="flex items-center justify-end gap-1">
                                      <button 
                                        onClick={() => handleEdit(art)}
                                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                      >
                                        <Edit3 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(art.id, art.designation)}
                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
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
                      {flattenedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {'\u00A0'.repeat((cat.niveau - 1) * 3)} {cat.nom}
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

                <div className="md:col-span-2 space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash size={12} /> Ventilation Analytique (/541/ & /542/)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Chapitre</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.chapitre}
                        onChange={e => setFormData({...formData, chapitre: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Nature</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.nature}
                        onChange={e => setFormData({...formData, nature: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Fonction</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.fonction}
                        onChange={e => setFormData({...formData, fonction: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Code Interne</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.codeInterne}
                        onChange={e => setFormData({...formData, codeInterne: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Type Mouvement</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.typeMouvement}
                        onChange={e => setFormData({...formData, typeMouvement: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Sens</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.sens}
                        onChange={e => setFormData({...formData, sens: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Structure</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                        value={formData.structure}
                        onChange={e => setFormData({...formData, structure: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">Gestionnaire (/542/)</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all font-bold text-sm font-black text-indigo-600"
                        value={formData.gestionnaire}
                        onChange={e => setFormData({...formData, gestionnaire: e.target.value})}
                      />
                    </div>
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
      {isModeModalOpen && (
        <ModeTaxationModal 
          isOpen={isModeModalOpen}
          onClose={() => setIsModeModalOpen(false)}
          onUpdate={fetchData}
        />
      )}
      {isTlpeModalOpen && (
        <TlpeTarifsModal 
          isOpen={isTlpeModalOpen}
          onClose={() => setIsTlpeModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
      {isOdpModalOpen && (
        <OdpDocsModal 
          isOpen={isOdpModalOpen}
          onClose={() => setIsOdpModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
