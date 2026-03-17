"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Plus, 
  Save, 
  Trash2, 
  Move, 
  Type, 
  Square, 
  Image as ImageIcon, 
  Database,
  ChevronLeft,
  Loader2,
  Maximize,
  Layers,
  Settings2,
  Copy,
  LayoutDashboard,
  Upload,
  ChevronDown
} from 'lucide-react';

interface Element {
  id: string;
  type: 'TEXT' | 'RECT' | 'IMAGE' | 'VARIABLE';
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  style: any;
}

const VARIABLES = [
  { label: 'N° Dossier', value: '{id}' },
  { label: 'Nom Dossier', value: '{nom}' },
  { label: 'Nom Tiers', value: '{tiers.nom}' },
  { label: 'Adresse', value: '{adresse}' },
  { label: 'Date Début', value: '{dateDebut}' },
  { label: 'Date Fin', value: '{dateFin}' },
  { label: 'Montant Total', value: '{totalHT}' },
  { label: 'Date du jour', value: '{today}' }
];

const FONTS = [
  { label: 'Inter (Sans)', value: '"Inter", sans-serif' },
  { label: 'Roboto (Modern)', value: '"Roboto", sans-serif' },
  { label: 'Outfit', value: '"Outfit", sans-serif' },
  { label: 'Serif (Classique)', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' }
];

export default function GabaritPage() {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gabaritId, setGabaritId] = useState<number | null>(null);
  const [gabaritNom, setGabaritNom] = useState('Gabarit Standard');
  const [isDefault, setIsDefault] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [allGabarits, setAllGabarits] = useState<any[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.75);

  useEffect(() => {
    fetchGabarits();
  }, []);

  const fetchGabarits = async () => {
    try {
      const res = await axios.get('/api/gabarits');
      setAllGabarits(res.data);
      if (res.data.length > 0 && !gabaritId) {
         loadGabarit(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGabarit = (g: any) => {
    setGabaritId(g.id);
    setGabaritNom(g.nom);
    setIsDefault(!!g.isDefault);
    try {
      const parsed = JSON.parse(g.contenu);
      setElements(parsed.elements || []);
    } catch (e) {
      setElements([]);
    }
    setIsListOpen(false);
  };

  const createNewGabarit = () => {
    setGabaritId(null);
    setGabaritNom('Nouveau Gabarit');
    setIsDefault(false);
    setElements([]);
    setIsListOpen(false);
  };

  const addElement = (type: Element['type']) => {
    const newEl: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      width: type === 'RECT' ? 200 : 150,
      height: type === 'RECT' ? 100 : 30,
      value: type === 'VARIABLE' ? VARIABLES[0].value : (type === 'TEXT' ? 'Nouveau texte' : ''),
      style: {
        fontSize: 12,
        fontFamily: FONTS[0].value,
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: type === 'RECT' ? '#e2e8f0' : 'transparent',
        textAlign: 'left',
        padding: 5,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000'
      }
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: gabaritNom,
        contenu: JSON.stringify({ elements }),
        isDefault: isDefault
      };
      if (gabaritId) {
        await axios.patch(`/api/gabarits/${gabaritId}`, payload);
      } else {
        const res = await axios.post('/api/gabarits', payload);
        setGabaritId(res.data.id);
      }
      fetchGabarits();
      alert('Gabarit enregistré avec succès !');
    } catch (err) {
      alert('Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!gabaritId) return;
    setSaving(true);
    try {
      const payload = {
        nom: `Copie de ${gabaritNom}`,
        contenu: JSON.stringify({ elements }),
        isDefault: false
      };
      const res = await axios.post('/api/gabarits', payload);
      setGabaritId(res.data.id);
      setGabaritNom(res.data.nom);
      setIsDefault(false);
      fetchGabarits();
      alert('Gabarit dupliqué avec succès !');
    } catch (err) {
      alert('Erreur lors de la duplication');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGabarit = async (id: number) => {
    if (!confirm('Supprimer ce gabarit définitivement ?')) return;
    try {
      await axios.delete(`/api/gabarits/${id}`);
      if (gabaritId === id) {
        createNewGabarit();
      }
      fetchGabarits();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleMouseDown = (e: React.MouseEvent, el: Element) => {
    setSelectedId(el.id);
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - el.x,
        y: e.clientY - rect.top - el.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        let newX = e.clientX - rect.left - dragOffset.x;
        let newY = e.clientY - rect.top - dragOffset.y;
        
        // Grid snap option? maybe later
        updateElement(selectedId, { x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const replaceVars = (val: string) => {
    if (!isPreview || !val) return val;
    return val
      .replace('{id}', '1234')
      .replace('{nom}', 'Terrasse Café de la Paix')
      .replace('{tiers.nom}', 'SARL La Paix')
      .replace('{adresse}', '12 rue de la République')
      .replace('{dateDebut}', '01/01/2024')
      .replace('{dateFin}', '31/12/2024')
      .replace('{totalTTC}', '450.00 €')
      .replace('{totalHT}', '450.00 €')
      .replace('{today}', format(new Date(), 'dd/MM/yyyy'));
  };

  const handleFit = () => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      const parent = canvasRef.current.parentElement;
      const fitZoom = (parent.clientHeight - 80) / 842; // Leave some padding
      setZoom(Number(fitZoom.toFixed(2)));
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Initialisation de l'éditeur...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
             <ChevronLeft size={20} />
           </Link>
           <div className="relative">
             <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsListOpen(!isListOpen)}>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{gabaritNom}</h2>
               <ChevronDown size={20} className={`text-slate-300 group-hover:text-blue-500 transition-all ${isListOpen ? 'rotate-180' : ''}`} />
             </div>
             
             {isListOpen && (
               <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                  <div className="max-h-60 overflow-y-auto space-y-1 mb-2">
                    {allGabarits.map(g => (
                      <div key={g.id} className="group/item flex items-center gap-1 pr-2 hover:bg-slate-50 rounded-xl transition-all">
                        <button 
                          onClick={() => loadGabarit(g)}
                          className={`flex-1 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${g.id === gabaritId ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                        >
                          <span>{g.nom}</span>
                          {g.isDefault && <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">Actif</span>}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteGabarit(g.id); }}
                          className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={createNewGabarit}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    <Plus size={14} /> Nouveau Gabarit
                  </button>
               </div>
             )}

             <div className="flex items-center gap-4 mt-1">
                <input 
                  value={gabaritNom} 
                  onChange={e => setGabaritNom(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black text-slate-900 uppercase tracking-widest outline-none focus:border-blue-500 transition-colors w-64"
                  placeholder="Nom du gabarit..."
                />
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isDefault}
                    onChange={e => setIsDefault(e.target.checked)}
                    className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                    Défaut pour facturation
                  </span>
               </label>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={createNewGabarit}
             className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
           >
             <Plus size={14} />
             Nouveau
           </button>
           <button 
             onClick={handleDuplicate}
             disabled={saving || !gabaritId}
             className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
           >
             {saving ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
             Copier
           </button>
           <button 
             onClick={() => setIsPreview(!isPreview)}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isPreview ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border border-slate-200 text-slate-600'}`}
           >
             {isPreview ? <LayoutDashboard size={14} /> : <Maximize size={14} />}
             {isPreview ? 'Édition' : 'Aperçu'}
           </button>
           <button 
             onClick={handleSave}
             disabled={saving}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
           >
             {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
             {gabaritId ? 'Enregistrer les modifications' : 'Créer le gabarit'}
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Toolbar */}
        <aside className="w-64 bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col gap-8 shadow-sm">
           <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Composants</h3>
             <div className="grid grid-cols-2 gap-2">
               <button onClick={() => addElement('TEXT')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                 <Type size={18} className="text-slate-400 group-hover:text-blue-600" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Texte</span>
               </button>
               <button onClick={() => addElement('VARIABLE')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                 <Database size={18} className="text-slate-400 group-hover:text-blue-600" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Donnée</span>
               </button>
               <button onClick={() => addElement('RECT')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                 <Square size={18} className="text-slate-400 group-hover:text-blue-600" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Bloc</span>
               </button>
               <button onClick={() => addElement('IMAGE')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                 <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-600" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Logo</span>
               </button>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">
               Couches
               <Layers size={14} />
             </h3>
             <div className="space-y-2">
               {elements.map((el, i) => (
                 <button 
                  key={el.id} 
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedId === el.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-50 hover:bg-slate-50'}`}
                 >
                   <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                     {i + 1}
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-black text-slate-900 uppercase truncate">
                       {el.type === 'VARIABLE' ? el.value : (el.value || el.type)}
                     </p>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1.5 text-slate-300 hover:text-rose-500">
                     <Trash2 size={12} />
                   </button>
                 </button>
               ))}
             </div>
           </div>
        </aside>

        {/* Canvas Area */}
        <main 
          className="flex-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative flex items-start justify-center p-10"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           <div 
             ref={canvasRef}
             className="bg-white shadow-2xl relative w-[595px] h-[842px] origin-top transition-transform duration-300"
             style={{ 
               width: '595px', 
               height: '842px',
               transform: `scale(${zoom})`
             }} // A4 approx
           >
              {/* Grid backdrop */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el)}
                    className={`absolute cursor-move select-none transition-shadow ${isSelected ? 'ring-2 ring-blue-500 shadow-2xl z-40' : 'hover:ring-1 hover:ring-slate-300'}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      ...el.style,
                      backgroundImage: el.type === 'IMAGE' ? `url(${el.value})` : 'none',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: el.style.textAlign === 'center' ? 'center' : (el.style.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                      overflow: 'hidden'
                    }}
                  >
                    {el.type === 'RECT' || el.type === 'IMAGE' ? null : (el.type === 'VARIABLE' ? (
                        <span className={isPreview ? '' : 'font-mono bg-blue-50 text-blue-600 px-2 rounded border border-blue-100 whitespace-nowrap'}>
                            {replaceVars(el.value)}
                        </span>
                    ) : replaceVars(el.value))}
                    
                    {isSelected && !isDragging && (
                      <>
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize" />
                      </>
                    )}
                  </div>
                );
              })}
           </div>

           <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase z-50">
              <button 
                onClick={() => setZoom(0.75)} 
                className={`transition-colors ${zoom === 0.75 ? 'text-blue-600' : 'hover:text-slate-900'}`}
              >
                75%
              </button>
              <div className="w-px h-3 bg-slate-300" />
              <button 
                onClick={() => setZoom(1)} 
                className={`transition-colors ${zoom === 1 ? 'text-blue-600' : 'hover:text-slate-900'}`}
              >
                100%
              </button>
              <div className="w-px h-3 bg-slate-300" />
              <button onClick={handleFit} className="hover:text-slate-900 transition-colors">Ajuster</button>
              <div className="w-px h-3 bg-slate-300" />
              <span className="text-slate-300">{(zoom * 100).toFixed(0)}%</span>
           </div>
        </main>

        {/* Right Sidebar: Properties */}
        <aside className="w-80 bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col gap-10 shadow-sm overflow-y-auto">
           {selectedElement ? (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                     Propriétés
                     <Settings2 size={14} />
                   </h3>
                   <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                        {selectedElement.type}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">ID: {selectedElement.id}</span>
                   </div>
                </div>

                <div className="space-y-6">
                   {selectedElement.type === 'VARIABLE' ? (
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valeur Dynamique</label>
                       <select 
                         value={selectedElement.value}
                         onChange={e => updateElement(selectedElement.id, { value: e.target.value })}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500"
                       >
                         {VARIABLES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                       </select>
                     </div>
                   ) : selectedElement.type === 'IMAGE' ? (
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image Source</label>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-200 border-dashed"
                       >
                         <Upload size={14} /> Choisir une image
                       </button>
                       {selectedElement.value && (
                         <div className="mt-2 aspect-video rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                           <img src={selectedElement.value} alt="Preview" className="max-w-full max-h-full object-contain" />
                         </div>
                       )}
                     </div>
                   ) : selectedElement.type !== 'RECT' ? (
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenu</label>
                       <textarea 
                         value={selectedElement.value}
                         onChange={e => updateElement(selectedElement.id, { value: e.target.value })}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 min-h-[80px]"
                       />
                     </div>
                   ) : null}

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Largeur</label>
                        <input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hauteur</label>
                        <input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" />
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style & Apparence</h4>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400">Taille Police</label>
                           <input type="number" value={selectedElement.style.fontSize} onChange={e => updateElement(selectedId!, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400">Police</label>
                           <select value={selectedElement.style.fontFamily} onChange={e => updateElement(selectedId!, { style: { ...selectedElement.style, fontFamily: e.target.value }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold">
                             {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400">Couleur Texte</label>
                        <input type="color" value={selectedElement.style.color} onChange={e => updateElement(selectedId!, { style: { ...selectedElement.style, color: e.target.value }})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400">Poids</label>
                        <select value={selectedElement.style.fontWeight} onChange={e => updateElement(selectedId!, { style: { ...selectedElement.style, fontWeight: e.target.value }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold">
                          <option value="normal">Normal</option>
                          <option value="bold">Gras</option>
                          <option value="black">Noir</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400">Alignement</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           <button onClick={() => updateElement(selectedId!, { style: { ...selectedElement.style, textAlign: 'left' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'left' ? 'bg-white shadow-sm' : ''}`}>Gauche</button>
                           <button onClick={() => updateElement(selectedId!, { style: { ...selectedElement.style, textAlign: 'center' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'center' ? 'bg-white shadow-sm' : ''}`}>Centre</button>
                           <button onClick={() => updateElement(selectedId!, { style: { ...selectedElement.style, textAlign: 'right' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'right' ? 'bg-white shadow-sm' : ''}`}>Droite</button>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400">Fond (Arr.)</label>
                        <input type="color" value={selectedElement.style.backgroundColor} onChange={e => updateElement(selectedId!, { style: { ...selectedElement.style, backgroundColor: e.target.value }})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" />
                     </div>
                   </div>

                   <button 
                    onClick={() => deleteElement(selectedElement.id)}
                    className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                   >
                     <Trash2 size={16} /> Supprimer l'élément
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-slate-300">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Move size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun élément sélectionné</p>
                  <p className="text-[9px] font-bold mt-1">Cliquez sur un composant pour le configurer</p>
                </div>
             </div>
           )}
        </aside>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !selectedId) return;
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await axios.post('/api/upload', formData);
            updateElement(selectedId, { value: res.data.url });
          } catch (err) {
            alert('Erreur lors du téléchargement');
          }
        }}
      />
    </div>
  );
}
