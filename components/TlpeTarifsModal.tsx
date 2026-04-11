import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Loader2, Euro, Calendar, Tag, Info } from 'lucide-react';

interface TlpeTarifsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TlpeTarifsModal({ isOpen, onClose, onSuccess }: TlpeTarifsModalProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'catalogue'>('grid');
  const [catalogueArticles, setCatalogueArticles] = useState<any[]>([]);
  const [annee, setAnnee] = useState('2025');
  const [submitting, setSubmitting] = useState(false);
  
  const [tarifs, setTarifs] = useState({
    enseignes_12_50: '17.50',
    enseignes_50_plus: '35.00',
    pub_non_num_50_moins: '17.50',
    pub_non_num_50_plus: '35.00',
    pub_num_50_moins: '35.00',
    pub_num_50_plus: '70.00'
  });
  const [availableConfigs, setAvailableConfigs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnee, setNewAnnee] = useState('');
  const [rawArticles, setRawArticles] = useState<any[]>([]);
  const [exoneration, setExoneration] = useState('0');
  const [deliberationFile, setDeliberationFile] = useState<File | null>(null);
  const [tarifsFile, setTarifsFile] = useState<File | null>(null);
  const [existingConfig, setExistingConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/articles/tlpe').then(res => {
        const configs = res.data.configs || [];
        setAvailableConfigs(configs);
        if (configs.length > 0) {
          setAnnee(configs[0].annee.toString());
        } else {
          setIsCreating(true);
          setNewAnnee(new Date().getFullYear().toString());
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isCreating && annee) {
      axios.get(`/api/articles/tlpe?annee=${annee}`).then(res => {
        if (res.data.config) {
          setExoneration(res.data.config.exoneration?.toString() || '0');
          setExistingConfig(res.data.config);
          
          if (res.data.tarifs) {
            const t = res.data.tarifs;
            setTarifs({
              enseignes_12_50: t.enseignes_12_50?.toString() || '0',
              enseignes_50_plus: t.enseignes_50_plus?.toString() || '0',
              pub_non_num_50_moins: t.pub_non_num_50_moins?.toString() || '0',
              pub_non_num_50_plus: t.pub_non_num_50_plus?.toString() || '0',
              pub_num_50_moins: t.pub_num_50_moins?.toString() || '0',
              pub_num_50_plus: t.pub_num_50_plus?.toString() || '0'
            });
          }
          const allArticles = res.data.articles || [];
          setRawArticles(allArticles);
          setCatalogueArticles(allArticles.filter((a: any) => a.meta?.isCatalogue).map((a: any) => ({
            id: a.id,
            numero: a.numero || '',
            designation: a.designation,
            tlpeType: a.meta?.tlpeType || 'ENSEIGNE'
          })));
        } else {
          setExistingConfig(null);
          setExoneration('0');
          setTarifs({
            enseignes_12_50: '0',
            enseignes_50_plus: '0',
            pub_non_num_50_moins: '0',
            pub_non_num_50_plus: '0',
            pub_num_50_moins: '0',
            pub_num_50_plus: '0'
          });
          setCatalogueArticles([]);
        }
      }).catch(() => {});
    }
  }, [annee, isOpen, isCreating]);

  const handleCreateNew = () => {
    setIsCreating(true);
    setNewAnnee((new Date().getFullYear() + 1).toString());
    setDeliberationFile(null);
    setTarifsFile(null);
    setExistingConfig(null);
    setCatalogueArticles([]);
  };

  const addCatalogueArticle = () => {
    setCatalogueArticles([...catalogueArticles, { id: -Date.now(), numero: '', designation: '', tlpeType: 'ENSEIGNE' }]);
  };

  const updateCatalogueArticle = (id: number, field: string, value: string) => {
    setCatalogueArticles(catalogueArticles.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeCatalogueArticle = (id: number) => {
    setCatalogueArticles(catalogueArticles.filter(a => a.id !== id));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let deliberationPath = existingConfig?.deliberationPath;
    let tarifsPath = existingConfig?.tarifsPath;

    try {
      if (deliberationFile) {
        const formData = new FormData();
        formData.append('file', deliberationFile);
        const uploadRes = await axios.post('/api/upload', formData);
        deliberationPath = uploadRes.data.url;
      }
      
      if (tarifsFile) {
        const formData = new FormData();
        formData.append('file', tarifsFile);
        const uploadRes = await axios.post('/api/upload', formData);
        tarifsPath = uploadRes.data.url;
      }

      await axios.post('/api/articles/tlpe', {
        annee: isCreating ? parseInt(newAnnee) : parseInt(annee),
        tarifs,
        exoneration,
        deliberationPath: deliberationPath || null,
        tarifsPath: tarifsPath || null,
        catalogueArticles
      });
      setIsCreating(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('TLPE Save Error:', err);
      const msg = err.response?.data?.error || err.message || 'Erreur inconnue';
      alert(`Erreur lors de la configuration TLPE : ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-purple-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
              <Euro size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Configuration TLPE</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                Paramétrage des tarifs et catalogue d'articles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
              >
                Grille de Référence
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('catalogue')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalogue' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
              >
                Catalogue Articles
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col p-8 space-y-8">
          {activeTab === 'grid' ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              {isCreating ? (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Initialisation Nouvelle Année</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar size={14} /> Année de référence
                      </label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-xl"
                        value={newAnnee}
                        onChange={e => setNewAnnee(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Calendar size={14} /> Année de référence
                    </label>
                    <div className="flex items-center gap-2">
                      <select 
                        required
                        className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-black text-xl"
                        value={annee}
                        onChange={e => setAnnee(e.target.value)}
                      >
                        {availableConfigs.map(c => (
                          <option key={c.annee} value={c.annee.toString()}>{c.annee}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={handleCreateNew}
                        className="p-3 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Tag size={14} /> Seuil d'exonération (m²)
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-xl"
                      value={exoneration}
                      onChange={e => setExoneration(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Délibération (PDF)</label>
                   {existingConfig?.deliberationPath && (
                     <div className="mb-2">
                       <a href={existingConfig.deliberationPath} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline flex items-center gap-1">
                         <Info size={12} /> Voir la délibération actuelle
                       </a>
                     </div>
                   )}
                   <input type="file" accept=".pdf" className="text-xs font-bold w-full" onChange={e => setDeliberationFile(e.target.files?.[0] || null)} />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tarifs officiels (PDF)</label>
                   {existingConfig?.tarifsPath && (
                     <div className="mb-2">
                       <a href={existingConfig.tarifsPath} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline flex items-center gap-1">
                         <Info size={12} /> Voir la grille tarifaire actuelle
                       </a>
                     </div>
                   )}
                   <input type="file" accept=".pdf" className="text-xs font-bold w-full" onChange={e => setTarifsFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enseignes */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b pb-2">Enseignes</h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">12 - 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.enseignes_12_50} onChange={e => setTarifs({...tarifs, enseignes_12_50: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">&gt; 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.enseignes_50_plus} onChange={e => setTarifs({...tarifs, enseignes_50_plus: e.target.value})} />
                  </div>
                </div>

                {/* Non Num */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2">Non-Numériques</h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">≤ 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.pub_non_num_50_moins} onChange={e => setTarifs({...tarifs, pub_non_num_50_moins: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">&gt; 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.pub_non_num_50_plus} onChange={e => setTarifs({...tarifs, pub_non_num_50_plus: e.target.value})} />
                  </div>
                </div>

                {/* Num */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b pb-2">Numériques</h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">≤ 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.pub_num_50_moins} onChange={e => setTarifs({...tarifs, pub_num_50_moins: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">&gt; 50 m²</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" value={tarifs.pub_num_50_plus} onChange={e => setTarifs({...tarifs, pub_num_50_plus: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Votre catalogue d'articles techniques</h4>
                <button 
                  type="button" 
                  onClick={addCatalogueArticle}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Ajouter un libellé
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Désignation de l'article</th>
                      <th className="px-6 py-4 w-48">Type (Catégorie TLPE)</th>
                      <th className="px-6 py-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalogueArticles.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-xs font-bold text-slate-400 italic">
                          Aucun article personnalisé. Le système utilisera les articles de référence par défaut.
                        </td>
                      </tr>
                    )}
                    {catalogueArticles.map((art) => (
                      <tr key={art.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            className="w-full bg-transparent font-bold text-slate-600 outline-none" 
                            placeholder="Ex: Enseigne Parallèle"
                            value={art.designation}
                            onChange={(e) => updateCatalogueArticle(art.id, 'designation', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            className="w-full bg-purple-50 text-purple-600 font-black text-[10px] uppercase p-2 rounded-lg cursor-pointer outline-none border-none"
                            value={art.tlpeType}
                            onChange={(e) => updateCatalogueArticle(art.id, 'tlpeType', e.target.value)}
                          >
                            <option value="ENSEIGNE">Enseigne</option>
                            <option value="NON_NUM">Non-Numérique</option>
                            <option value="NUM">Numérique</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            type="button" 
                            onClick={() => removeCatalogueArticle(art.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] font-bold text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                Note : Le tarif appliqué à ces articles sera calculé automatiquement chaque année en fonction du Type choisi et de la surface renseignée dans le dossier, selon votre Grille de Référence.
              </p>
            </div>
          )}

          <div className="shrink-0 flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isCreating ? 'Initialiser l\'année' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
