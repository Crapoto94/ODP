import React, { useState, useEffect } from 'react';
import { differenceInDays, isLeapYear } from 'date-fns';
import { X, Check, Save, Loader2, Euro, Upload, Image as ImageIcon, Trash2, Plus, Info, Hash, Tag, Search, Calendar, Maximize2 } from 'lucide-react';
import axios from 'axios';

interface Article {
  id: number;
  numero: string | null;
  designation: string;
  montant: number;
  meta?: {
    isCatalogue?: boolean;
    tlpeType?: 'ENSEIGNE' | 'NUM' | 'NON_NUM';
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  occupationId: number;
  annee: number;
  editingLigne?: any;
}

export default function TlpeLigneArticleModal({ isOpen, onClose, onSuccess, occupationId, annee, editingLigne: initialData }: Props) {
  const [catalogueArticles, setCatalogueArticles] = useState<Article[]>([]);
  const [refTarifs, setRefTarifs] = useState<any>(null);
  const [tlpeConfig, setTlpeConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [surface, setSurface] = useState<string>(initialData?.quantite1?.toString() || '');
  const [dateDebut, setDateDebut] = useState<string>(initialData?.dateDebut ? initialData.dateDebut.split('T')[0] : `${annee}-01-01`);
  const [dateFin, setDateFin] = useState<string>(initialData?.dateFin ? initialData.dateFin.split('T')[0] : `${annee}-12-31`);
  const [filterText, setFilterText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTlpeData();
      if (initialData) {
        setSelectedArticleId(initialData.articleId);
        setSurface(initialData.quantite1.toString());
        setPhotos(initialData.photos ? initialData.photos.split(',').filter(Boolean) : []);
      } else {
        setSelectedArticleId(null);
        setSurface('');
        setDateDebut(`${annee}-01-01`);
        setDateFin(`${annee}-12-31`);
        setPhotos([]);
        setFilterText('');
      }
    }
  }, [isOpen, initialData, annee]);

  const fetchTlpeData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/articles/tlpe?annee=${annee}`);
      const articles = res.data.articles || [];
      const catalogue = articles.filter((a: any) => a.meta?.isCatalogue);
      setCatalogueArticles(catalogue);
      setRefTarifs(res.data.tarifs);
      setTlpeConfig(res.data.config);

      if (initialData) {
        const art = catalogue.find((a: any) => a.id === initialData.articleId);
        if (art) setFilterText(`${art.numero ? `[${art.numero}] ` : ''}${art.designation}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateMontant = () => {
    if (!selectedArticleId || !refTarifs) return 0;
    const art = catalogueArticles.find(a => a.id === selectedArticleId);
    if (!art) return 0;

    const s = parseFloat(surface.replace(',', '.')) || 0;
    const type = art.meta?.tlpeType;

    if (type === 'ENSEIGNE') {
      if (s <= 50) return refTarifs.enseignes_12_50;
      return refTarifs.enseignes_50_plus;
    }
    if (type === 'NON_NUM') {
      if (s <= 50) return refTarifs.pub_non_num_50_moins;
      return refTarifs.pub_non_num_50_plus;
    }
    if (type === 'NUM') {
      if (s <= 50) return refTarifs.pub_num_50_moins;
      return refTarifs.pub_num_50_plus;
    }
    return 0;
  };

  const unitPrice = calculateMontant();
  const s = parseFloat(surface.replace(',', '.')) || 0;
  
  // Prorata calculation
  const getProrata = () => {
    try {
      const d1 = new Date(dateDebut);
      const d2 = new Date(dateFin);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
      
      const daysInYear = isLeapYear(new Date(annee, 0, 1)) ? 366 : 365;
      const daysActive = differenceInDays(d2, d1) + 1;
      return Math.min(1, Math.max(0, daysActive / daysInYear));
    } catch (e) {
      return 1;
    }
  };
  
  const prorata = getProrata();
  const totalAnnuelResult = unitPrice * s;
  const totalProratise = totalAnnuelResult * prorata;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId) return;
    
    setSaving(true);
    try {
      const s = parseFloat(surface.replace(',', '.')) || 0;
      const submitData = { 
        articleId: selectedArticleId,
        quantite1: s,
        quantite2: 1, 
        dateDebut: dateDebut,
        dateFin: dateFin,
        montant: unitPrice, 
        photos: photos.join(',')
      };

      if (initialData?.id) {
        await axios.patch(`/api/occupations/${occupationId}/lignes/${initialData.id}`, submitData);
      } else {
        await axios.post(`/api/occupations/${occupationId}/lignes`, submitData);
      }
      onSuccess();
      onClose();
    } catch (e) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedArticle = catalogueArticles.find(a => a.id === selectedArticleId);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300 px-4 sm:px-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col border border-white">
        
        {/* Premium Header with Gradient */}
        <div className="relative p-7 bg-gradient-to-br from-purple-600 to-indigo-800 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-purple-200 uppercase tracking-[0.3em] mb-1 px-1 text-center sm:text-left">Référentiel TLPE</p>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-center sm:text-left">
                {initialData ? 'Modification' : 'Ajouter un article'}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-hide">
          {/* Article Search Engine */}
          <div className="space-y-3 relative">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} className="text-purple-500" /> Dispositif Publicitaire
              </label>
              <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">Tarification {annee}</span>
            </div>
            
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 group-focus-within:scale-110 transition-all duration-300">
                <Search size={20} />
              </div>
              <input 
                type="text"
                placeholder="Rechercher par code ou désignation..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-14 pr-6 outline-none focus:border-purple-500 focus:bg-white focus:shadow-xl focus:shadow-purple-500/5 transition-all font-bold text-sm"
                value={filterText}
                onChange={e => {
                  setFilterText(e.target.value);
                  if (selectedArticleId) setSelectedArticleId(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              />
            </div>

            {/* Results Popover */}
            {(isFocused || (filterText && !selectedArticleId)) && !selectedArticleId && (
              <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[160] max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-slate-900/5">
                {catalogueArticles
                  .filter(a => {
                    const q = filterText.toLowerCase();
                    return a.numero?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q);
                  })
                  .map(art => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        setSelectedArticleId(art.id);
                        setFilterText(`${art.numero ? `[${art.numero}] ` : ''}${art.designation}`);
                      }}
                      className="w-full text-left px-8 py-5 hover:bg-purple-600 hover:text-white group flex items-center justify-between border-b border-slate-50 last:border-0 transition-all"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black tracking-tight">{art.numero ? <span className="text-purple-500 group-hover:text-purple-200 mr-2">{art.numero}</span> : ''}{art.designation}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-70">{art.meta?.tlpeType || 'Dispositif'}</span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-white/20"></span>
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-70">Saisie en m²</span>
                        </div>
                      </div>
                      <Plus size={18} className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                {catalogueArticles.filter(a => {
                  const q = filterText.toLowerCase();
                  return a.numero?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                       <Info size={24} className="text-slate-300" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun dispositif trouvé</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Selected Card */}
            {selectedArticle && selectedArticleId && (
              <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-between group animate-in zoom-in-95">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
                     <Check size={20} strokeWidth={3} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1 leading-none">Sélectionné</p>
                     <p className="text-sm font-black text-purple-900 truncate max-w-[280px]">{selectedArticle.designation}</p>
                   </div>
                 </div>
                 <button 
                  type="button"
                  onClick={() => { setSelectedArticleId(null); setFilterText(''); }}
                  className="w-10 h-10 flex items-center justify-center text-purple-300 hover:text-purple-600 hover:bg-white rounded-xl transition-all active:scale-95"
                 >
                   <X size={20} />
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Surface Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center gap-2">
                 <Maximize2 size={12} className="text-purple-500" /> Surface (m²)
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-6 outline-none focus:border-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-500/5 transition-all font-black text-xl tabular-nums"
                  value={surface}
                  onChange={e => setSurface(e.target.value)}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-base group-focus-within:text-purple-500 transition-colors">m²</div>
              </div>
            </div>

            {/* Reference Box */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center gap-2">
                 <Hash size={12} className="text-purple-500" /> Dossier
              </label>
              <div className="w-full h-full min-h-[50px] bg-slate-100/50 border-2 border-slate-100 rounded-xl p-4 flex flex-col justify-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Occupation ID</p>
                 <p className="text-xs font-black text-slate-600 leading-none">#{occupationId}</p>
              </div>
            </div>
          </div>

          {/* Date Selection for Prorata */}
          <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center gap-2">
                 <Calendar size={12} className="text-purple-500" /> Date Début
              </label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-purple-500 transition-all font-bold"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center gap-2">
                 <Calendar size={12} className="text-purple-500" /> Date Fin
              </label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-purple-500 transition-all font-bold"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing Preview - Premium Dark Card */}
          {selectedArticle && surface && !isNaN(parseFloat(surface.replace(',', '.'))) && (
            <div className="bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden animate-in slide-in-from-bottom-6 transition-all shadow-2xl shadow-purple-900/20">
              <div className="absolute -right-8 -bottom-8 opacity-10 -rotate-12 translate-x-4 translate-y-4 pointer-events-none">
                <Euro size={160} />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-400">
                        <Euro size={16} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-left sm:text-left">Prix Unitaire</p>
                        <div className="text-xl font-black text-purple-400 leading-none text-left sm:text-left">{unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ <span className="text-[10px] opacity-40">/ m²</span></div>
                     </div>
                   </div>
                   
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-[200px] text-left">
                     Tarif appliqué automatiquement selon la zone et la surface totale.
                   </p>
                </div>
                
                <div className="text-right w-full md:w-auto">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">
                     {prorata < 0.999 ? `Montant Proratisé (${Math.round(prorata * 100)}%)` : 'Montant Annuel TTC'}
                   </p>
                   <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                     {totalProratise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xl text-purple-500">€</span>
                   </div>
                   {prorata < 0.999 && (
                     <p className="text-[10px] font-bold text-purple-400 mt-2">
                       Base annuelle : {totalAnnuelResult.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                     </p>
                   )}
                </div>
              </div>
            </div>
          )}

          {/* Photo Gallery - Premium Grid */}
          <div className="space-y-4 pt-4 text-left sm:text-left">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-purple-500" /> Portfolio Dispositif
              </label>
              <span className="text-[8px] font-black text-slate-300 uppercase">{photos.length} Photo(s)</span>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm hover:ring-4 hover:ring-purple-500/10 transition-all">
                  <img src={url} alt="Dispositif" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="w-10 h-10 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all scale-75 group-hover:scale-100 active:scale-90 shadow-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <label className="aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-purple-50 hover:border-purple-400 hover:text-purple-600 transition-all text-slate-400 group relative overflow-hidden">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />}
                <span className="text-[9px] font-black uppercase tracking-tighter">Ajouter</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-10">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest text-[9px] active:scale-95"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={saving || !selectedArticleId || !surface || isNaN(parseFloat(surface.replace(',', '.')))}
              className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white py-4 rounded-xl font-black shadow-2xl shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 uppercase tracking-widest text-[9px]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initialData ? 'Mettre à jour l\'article' : 'Enregistrer l\'article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
