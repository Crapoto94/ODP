"use client";
import React, { useState, useEffect } from 'react';
import { X, Check, Save, Loader2, Calendar, Hash, Info, Euro, Upload, Image as ImageIcon, Trash2, Plus, Clock, Search } from 'lucide-react';
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
  occupationType?: string;
}

export default function LigneArticleModal({ isOpen, onClose, onSave, occupationId, annee, defaultDates, initialData, occupationType }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(annee);
  
  const [formData, setFormData] = useState({
    articleId: '',
    quantite1: '1',
    quantite2: '1',
    dateDebut: defaultDates.start,
    dateFin: defaultDates.end,
    dateDebutConstatee: '',
    dateFinConstatee: ''
  });
  const [filterText, setFilterText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialYear = initialData?.dateDebut ? new Date(initialData.dateDebut).getFullYear() : annee;
      setCurrentYear(initialYear);
      fetchArticles(initialYear);
      if (initialData) {
        setFormData({
          articleId: initialData.articleId.toString(),
          quantite1: initialData.quantite1.toString(),
          quantite2: initialData.quantite2.toString(),
          dateDebut: initialData.dateDebut?.split('T')[0] || defaultDates.start,
          dateFin: initialData.dateFin?.split('T')[0] || defaultDates.end,
          dateDebutConstatee: initialData.dateDebutConstatee ? initialData.dateDebutConstatee.split('T')[0] : '',
          dateFinConstatee: initialData.dateFinConstatee ? initialData.dateFinConstatee.split('T')[0] : ''
        });
        setPhotos(initialData.photos ? initialData.photos.split(',').filter(Boolean) : []);
      } else {
        setFormData({
          articleId: '',
          quantite1: '1',
          quantite2: '1',
          dateDebut: defaultDates.start,
          dateFin: defaultDates.end,
          dateDebutConstatee: '',
          dateFinConstatee: ''
        });
        setPhotos([]);
      }
    }
  }, [isOpen, initialData, defaultDates, annee]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await axios.post('/api/upload', data);
      setPhotos(prev => [...prev, res.data.url]);
    } catch (err) {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const parseMode = (mode?: string) => {
    if (!mode) return { u1: 'Quantité 1', u2: 'Quantité 2' };
    const parts = mode.split('/').map(p => p.trim()).filter(Boolean);
    if (parts.length === 1) return { u1: parts[0], u2: 'Quantité 2' };
    return {
      u1: parts[0] || 'Quantité 1',
      u2: parts[1] || 'Quantité 2'
    };
  };

  const calculateQ2 = (u2: string, start: string, end: string, startC: string, endC: string) => {
    const s = new Date(startC || start);
    const e = new Date(endC || end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;

    const diffMs = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // Inclusive

    const unit = u2.toLowerCase();
    if (unit.includes('an')) {
      return 1;
    }
    if (unit.includes('10 jour')) {
      return Math.ceil(diffDays / 10);
    }
    if (unit.includes('mois')) {
      return Math.ceil(diffDays / 31);
    }
    if (unit.includes('jour')) {
      return diffDays;
    }
    return 1;
  };

  const labels = parseMode(articles.find(a => a.id.toString() === formData.articleId)?.modeTaxation?.nom);

  const fetchArticles = async (yearToFetch: number = currentYear) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/articles?annee=${yearToFetch}`);
      setArticles(res.data);
      setCurrentYear(yearToFetch);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!formData.dateDebut) return;
    const year = new Date(formData.dateDebut).getFullYear();
    if (year && year !== currentYear) {
      fetchArticles(year);
      setFormData(prev => ({ ...prev, articleId: '' })); // Reset selection if year changes
    }
  }, [formData.dateDebut, currentYear]);

  const selectedArticle = articles.find(a => a.id.toString() === formData.articleId);

  const getUnit = (mode?: string) => {
    if (!mode) return 'unité';
    if (mode === 'm²') return 'm²';
    return mode.split('/')[0].trim() || 'unité';
  };

  const unit = getUnit(selectedArticle?.modeTaxation?.nom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleId) return;
    
    setSaving(true);
    try {
      let q2 = parseFloat(formData.quantite2 || '1');
      if (occupationType === 'COMMERCE') {
        q2 = 1;
      } else if (occupationType === 'CHANTIER') {
        q2 = calculateQ2(labels.u2, formData.dateDebut, formData.dateFin, formData.dateDebutConstatee, formData.dateFinConstatee);
      }

      const submitData = { 
        ...formData, 
        articleId: parseInt(formData.articleId),
        quantite2: q2,
        quantite1: parseFloat(formData.quantite1 || '0'),
        photos: photos.join(',')
      };
      if (initialData?.id) {
        await axios.patch(`/api/occupations/${occupationId}/lignes/${initialData.id}`, submitData);
      } else {
        await axios.post(`/api/occupations/${occupationId}/lignes`, submitData);
      }
      onSave(submitData);
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tarifs {currentYear}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2 relative" id="article-search-container">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Article (N° ou Nom)</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="Saisir pour filtrer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                  value={filterText}
                  onChange={e => {
                    setFilterText(e.target.value);
                    if (formData.articleId) setFormData(prev => ({ ...prev, articleId: '' }));
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    // Slight delay to allow onClick to fire on the list
                    setTimeout(() => setIsFocused(false), 200);
                  }}
                />
              </div>

              {/* Custom Dropdown List */}
              {(isFocused || (filterText && !formData.articleId)) && !formData.articleId && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[120] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {articles
                    .filter(a => {
                      if (occupationType === 'COMMERCE') return a.numero?.startsWith('1');
                      if (occupationType === 'CHANTIER') return a.numero?.startsWith('2') || a.numero?.startsWith('3');
                      return true;
                    })
                    .filter(a => {
                      const q = filterText.toLowerCase();
                      return a.numero?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q);
                    })
                    .sort((a, b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true }))
                    .map(art => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, articleId: art.id.toString() }));
                          setFilterText(`${art.numero ? `[${art.numero}] ` : ''}${art.designation}`);
                        }}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{art.numero ? `[${art.numero}] ` : ''}{art.designation}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{art.modeTaxation?.nom || 'Unité'}</span>
                        </div>
                        <span className="text-xs font-black text-blue-600">{art.montant}€</span>
                      </button>
                    ))}
                  {articles.filter(a => {
                    if (occupationType === 'COMMERCE') return a.numero?.startsWith('1');
                    if (occupationType === 'CHANTIER') return a.numero?.startsWith('2') || a.numero?.startsWith('3');
                    return true;
                  }).filter(a => {
                    const q = filterText.toLowerCase();
                    return a.numero?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q);
                  }).length === 0 && (
                    <div className="p-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Aucun article trouvé
                    </div>
                  )}
                </div>
              )}

              {/* Selection Summary if an article is selected and filter matches */}
              {selectedArticle && formData.articleId && (
                <button 
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, articleId: '' }));
                    setFilterText('');
                  }}
                  className="mt-2 w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between group hover:bg-blue-100 transition-all"
                >
                   <div className="flex items-center gap-3">
                     <Check className="text-blue-600" size={16} />
                     <span className="text-xs font-black text-blue-900">{selectedArticle.numero ? `[${selectedArticle.numero}] ` : ''}{selectedArticle.designation}</span>
                   </div>
                   <X className="text-blue-300 group-hover:text-blue-600" size={16} />
                </button>
              )}
            </div>
            
            {selectedArticle && (
              <div className="space-y-2 mt-2">
                <div className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-bold text-blue-600 flex items-center gap-2">
                   <Euro size={12} /> {selectedArticle.montant} € {selectedArticle.modeTaxation?.nom && ` / ${unit}`}
                </div>
                {occupationType === 'CHANTIER' && (
                  <div className="px-4 py-2 bg-amber-50 rounded-xl text-[10px] font-bold text-amber-600 flex items-center gap-2">
                     <Clock size={12} /> Durée calculée : {calculateQ2(labels.u2, formData.dateDebut, formData.dateFin, formData.dateDebutConstatee, formData.dateFinConstatee)} {labels.u2}
                  </div>
                )}
              </div>
            )}
            {loading && <p className="text-[10px] font-bold text-blue-500 italic ml-1">Chargement des tarifs...</p>}
          </div>

          <div className={`grid ${occupationType === 'COMMERCE' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Hash size={12} /> {labels.u1}
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
            {occupationType !== 'COMMERCE' && occupationType !== 'CHANTIER' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Hash size={12} /> {labels.u2}
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
            )}
          </div>

          {occupationType !== 'COMMERCE' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={12} /> Début Prévu
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
                  <Calendar size={12} /> Fin Prévue
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
          )}

          {occupationType !== 'COMMERCE' && (
            <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Dates Constatées (Terrain)</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                    Début Réel
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-amber-100 rounded-2xl p-4 outline-none focus:border-amber-500 transition-all font-bold text-sm shadow-sm"
                    value={formData.dateDebutConstatee}
                    onChange={e => setFormData({ ...formData, dateDebutConstatee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                    Fin Réelle
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-amber-100 rounded-2xl p-4 outline-none focus:border-amber-500 transition-all font-bold text-sm shadow-sm"
                    value={formData.dateFinConstatee}
                    onChange={e => setFormData({ ...formData, dateFinConstatee: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

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
