"use client";

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
  Download,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd
} from 'lucide-react';

interface Element {
  id: string;
  type: 'TEXT' | 'RECT' | 'IMAGE' | 'VARIABLE';
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    padding: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
    noBackground: boolean;
  };
  isArticleRepeated?: boolean;
  verticalPitch?: number;
}

const VARIABLES = [
  { label: 'N° Dossier', value: '{id}' },
  { label: 'Nom Dossier', value: '{nom}' },
  { label: 'Nom Tiers', value: '{tiers.nom}' },
  { label: 'Adresse', value: '{adresse}' },
  { label: 'Date Début', value: '{dateDebut}' },
  { label: 'Date Fin', value: '{dateFin}' },
  { label: 'Montant Total', value: '{totalHT}' },
  { label: 'Date du jour', value: '{today}' },
  { label: 'Numéro de Facture', value: '{numeroFacture}' },
  { label: 'Période (Année)', value: '{periode}' },
  { label: 'Variable /12/', value: '{v12}' },
  { label: 'Variable /13/', value: '{v13}' },
  { label: 'Variable /20/', value: '{v20}' },
  { label: 'Ventilation /541/ (Chapitre)', value: '{v541.chapitre}' },
  { label: 'Ventilation /541/ (Nature)', value: '{v541.nature}' },
  { label: 'Ventilation /541/ (Fonction)', value: '{v541.fonction}' },
  { label: 'Ventilation /541/ (Code Interne)', value: '{v541.codeInterne}' },
  { label: 'Ventilation /541/ (Type Mvmt)', value: '{v541.typeMvmt}' },
  { label: 'Ventilation /541/ (Sens)', value: '{v541.sens}' },
  { label: 'Gestion /542/ (Structure)', value: '{v542.structure}' },
  { label: 'Gestion /542/ (Gestionnaire)', value: '{v542.gestionnaire}' },
  { label: 'Article: Désignation', value: '{article.designation}' },
  { label: 'Article: Quantité', value: '{article.quantite}' },
  { label: 'Article: Prix Unitaire', value: '{article.pu}' },
  { label: 'Article: Total HT', value: '{article.totalHT}' }
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

const MOCK_ARTICLES = [
  { designation: 'Occupation Domaine Public - Mars', quantite: 1, pu: 150.00 },
  { designation: 'Frais de dossier', quantite: 1, pu: 50.00 },
  { designation: 'Redevance exceptionnelle', quantite: 2, pu: 100.00 }
];

export default function GabaritPage() {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gabaritId, setGabaritId] = useState<number | null>(null);
  const [gabaritNom, setGabaritNom] = useState('Gabarit Standard');
  const [isDefault, setIsDefault] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [allGabarits, setAllGabarits] = useState<any[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<null | 'nw' | 'se'>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.75);

  useEffect(() => {
    fetchGabarits();
  }, []);

  const fetchGabarits = async () => {
    try {
      const res = await axios.get('/api/gabarits');
      setAllGabarits(Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(res.data) && res.data.length > 0 && !gabaritId) {
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
        borderWidth: type === 'RECT' ? 1 : 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        noBackground: false
      },
      isArticleRepeated: false,
      verticalPitch: 30
    };
    setElements([...elements, newEl]);
    setSelectedIds([newEl.id]);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedIds(selectedIds.filter(sid => sid !== id));
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

  const handleExportTemplate = () => {
    const data = JSON.stringify({ elements, nom: gabaritNom });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${gabaritNom.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.elements) {
          setElements(parsed.elements);
          if (parsed.nom) setGabaritNom(parsed.nom);
          alert('Template importé avec succès !');
        }
      } catch (err) {
        alert('Format de fichier invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleMouseDown = (e: React.MouseEvent, el: Element, resizeHandle?: 'nw' | 'se') => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (selectedIds.includes(el.id)) {
        setSelectedIds(selectedIds.filter(id => id !== el.id));
      } else {
        setSelectedIds([...selectedIds, el.id]);
      }
    } else {
      if (!selectedIds.includes(el.id)) {
        setSelectedIds([el.id]);
      }
    }
    if (resizeHandle) {
      setIsResizing(resizeHandle);
    } else if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom,
          y: (e.clientY - rect.top) / zoom
        });
      }
    } else {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom - el.x,
          y: (e.clientY - rect.top) / zoom - el.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    if (isPanning) {
      const dx = mouseX - dragOffset.x;
      const dy = mouseY - dragOffset.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragOffset({ x: mouseX, y: mouseY });
      return;
    }
    if (selectedIds.length === 0) return;
    if (isDragging) {
      const primaryId = selectedIds[selectedIds.length - 1];
      const primaryEl = elements.find(item => item.id === primaryId);
      if (!primaryEl) return;
      const dx = Math.round(mouseX - dragOffset.x) - primaryEl.x;
      const dy = Math.round(mouseY - dragOffset.y) - primaryEl.y;
      setElements(elements.map(item => 
        selectedIds.includes(item.id) 
          ? { ...item, x: item.x + dx, y: item.y + dy } 
          : item
      ));
    } else if (isResizing && selectedIds.length === 1) {
      const selectedId = selectedIds[0];
      const el = elements.find(item => item.id === selectedId);
      if (!el) return;
      if (isResizing === 'se') {
        updateElement(selectedId, { 
          width: Math.max(10, Math.round(mouseX - el.x)), 
          height: Math.max(10, Math.round(mouseY - el.y)) 
        });
      } else if (isResizing === 'nw') {
        const newWidth = el.width + (el.x - mouseX);
        const newHeight = el.height + (el.y - mouseY);
        if (newWidth > 10 && newHeight > 10) {
          updateElement(selectedId, { 
            x: Math.round(mouseX), 
            y: Math.round(mouseY),
            width: Math.round(newWidth), 
            height: Math.round(newHeight) 
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom with wheel by default as requested
    const zoomIn = e.deltaY < 0;
    const zoomAmount = 0.05;
    setZoom(prev => Math.min(2, Math.max(0.1, prev + (zoomIn ? zoomAmount : -zoomAmount))));
  };

  const alignElements = (side: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY') => {
    if (selectedIds.length < 2) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    let targetValue: number;
    switch(side) {
      case 'left': targetValue = Math.min(...selectedElements.map(e => e.x)); break;
      case 'right': targetValue = Math.max(...selectedElements.map(e => e.x + e.width)); break;
      case 'top': targetValue = Math.min(...selectedElements.map(e => e.y)); break;
      case 'bottom': targetValue = Math.max(...selectedElements.map(e => e.y + e.height)); break;
      case 'centerX': 
        const minX = Math.min(...selectedElements.map(e => e.x));
        const maxX = Math.max(...selectedElements.map(e => e.x + e.width));
        targetValue = (minX + maxX) / 2;
        break;
      case 'centerY':
        const minY = Math.min(...selectedElements.map(e => e.y));
        const maxY = Math.max(...selectedElements.map(e => e.y + e.height));
        targetValue = (minY + maxY) / 2;
        break;
      default: return;
    }
    setElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      switch(side) {
        case 'left': return { ...el, x: targetValue };
        case 'right': return { ...el, x: targetValue - el.width };
        case 'top': return { ...el, y: targetValue };
        case 'bottom': return { ...el, y: targetValue - el.height };
        case 'centerX': return { ...el, x: targetValue - el.width / 2 };
        case 'centerY': return { ...el, y: targetValue - el.height / 2 };
      }
      return el;
    }));
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    setElements([...elements.filter(e => !selectedIds.includes(e.id)), ...selected]);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    setElements([...selected, ...elements.filter(e => !selectedIds.includes(e.id))]);
  };

  const replaceVars = (val: string, article?: any) => {
    if (!isPreview || !val) return val;
    let res = val
      .replace('{id}', '1234')
      .replace('{nom}', 'Terrasse Café de la Paix')
      .replace('{tiers.nom}', 'SARL La Paix')
      .replace('{adresse}', '12 rue de la République')
      .replace('{dateDebut}', '01/01/2024')
      .replace('{dateFin}', '31/12/2024')
      .replace('{totalTTC}', '450.00 €')
      .replace('{totalHT}', '450.00 €')
      .replace('{v12}', 'Code/12/MOCK')
      .replace('{v13}', 'Code/13/MOCK')
      .replace('{v20}', 'Code/20/MOCK')
      .replace('{v541.chapitre}', 'Chapitre A')
      .replace('{v541.nature}', 'Nature B')
      .replace('{v541.fonction}', 'Fonction C')
      .replace('{v541.codeInterne}', 'INT-999')
      .replace('{v541.typeMvmt}', 'RECETTE')
      .replace('{v541.sens}', 'CREDIT')
      .replace('{v542.structure}', 'STRUCTURE_X')
      .replace('{v542.gestionnaire}', 'GESTE_Y')
      .replace('{today}', format(new Date(), 'dd/MM/yyyy'));
    if (article) {
      res = res
        .replace('{article.designation}', article.designation)
        .replace('{article.quantite}', article.quantite.toString())
        .replace('{article.pu}', article.pu.toFixed(2) + ' €')
        .replace('{article.totalHT}', (article.quantite * article.pu).toFixed(2) + ' €');
    }
    return res;
  };

  const handleFit = () => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      const parent = canvasRef.current.parentElement;
      const fitZoom = (parent.clientHeight - 80) / 842;
      setZoom(Number(fitZoom.toFixed(2)));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Initialisation de l'éditeur...</p>
    </div>
  );

  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
             <ChevronLeft size={20} />
           </Link>
           <div className="relative">
             <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsListOpen(!isListOpen)}>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-loose">{gabaritNom}</h2>
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
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGabarit(g.id); }} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={createNewGabarit} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    <Plus size={14} /> Nouveau Gabarit
                  </button>
               </div>
             )}
             <div className="flex items-center gap-4 mt-1">
                <input value={gabaritNom} onChange={e => setGabaritNom(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black text-slate-900 uppercase tracking-widest outline-none focus:border-blue-500 transition-colors w-64" placeholder="Nom du gabarit..." />
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Défaut pour facturation</span>
                </label>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={createNewGabarit} className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
             <Plus size={14} /> Nouveau
           </button>
           <button onClick={handleDuplicate} disabled={saving || !gabaritId} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
             {saving ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />} Copier
           </button>
           <button onClick={() => setIsPreview(!isPreview)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isPreview ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border border-slate-200 text-slate-600'}`}>
             {isPreview ? <LayoutDashboard size={14} /> : <Maximize size={14} />} {isPreview ? 'Édition' : 'Aperçu'}
           </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
             {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {gabaritId ? 'Enregistrer' : 'Créer'}
           </button>
           <div className="w-px h-8 bg-slate-200 mx-1" />
           <button onClick={handleExportTemplate} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm" title="Exporter (JSON)">
             <Download size={18} />
           </button>
           <button onClick={() => importInputRef.current?.click()} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm" title="Importer (JSON)">
             <Upload size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
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
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center justify-between">Couches <Layers size={14} /></h3>
             <div className="space-y-2">
               {elements.map((el, i) => (
                 <button key={el.id} onClick={(e) => { if (e.shiftKey) { setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]); } else { setSelectedIds([el.id]); } }} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedIds.includes(el.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-50 hover:bg-slate-50'}`}>
                   <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">{i + 1}</div>
                   <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-black text-slate-900 uppercase truncate">{el.type === 'VARIABLE' ? el.value : (el.value || el.type)}</p>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                 </button>
               ))}
             </div>
           </div>
        </aside>

        <main className="flex-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative flex items-start justify-center p-10 cursor-grab active:cursor-grabbing" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseDown={(e) => { if (e.button === 1 || e.altKey) { setIsPanning(true); const rect = canvasRef.current?.getBoundingClientRect(); if (rect) { setDragOffset({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }); } } else { setSelectedIds([]); } }} onWheel={handleWheel}>
           <div ref={canvasRef} className="bg-white shadow-2xl relative transition-transform duration-75" style={{ width: 595, height: 842, transformOrigin: 'top center', transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`, minWidth: 595, minHeight: 842 }}>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              {elements.map((el) => {
                  const isSelected = selectedIds.includes(el.id);
                  const instances = (isPreview && el.isArticleRepeated) ? MOCK_ARTICLES : [null];
                  return instances.map((article, idx) => (
                    <div key={`${el.id}-${idx}`} onMouseDown={(e) => handleMouseDown(e, el)} className={`absolute cursor-move select-none transition-shadow ${isSelected ? 'ring-2 ring-blue-500 shadow-2xl z-40' : 'hover:ring-1 hover:ring-slate-300'}`} style={{ left: el.x, top: el.y + (idx * (el.verticalPitch || 30)), width: el.width, height: el.height, ...el.style, backgroundImage: el.type === 'IMAGE' ? `url(${el.value})` : 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-start', justifyContent: el.style.textAlign === 'center' ? 'center' : (el.style.textAlign === 'right' ? 'flex-end' : 'flex-start'), overflow: 'hidden', borderStyle: el.style.borderStyle || 'solid', backgroundColor: el.style.noBackground ? 'transparent' : el.style.backgroundColor, zIndex: isSelected ? 50 : undefined, whiteSpace: 'pre-wrap' }}>
                      {el.type === 'RECT' || el.type === 'IMAGE' ? null : (el.type === 'VARIABLE' ? (<span className={isPreview ? '' : 'font-mono bg-blue-50 text-blue-600 px-2 rounded border border-blue-100 whitespace-nowrap'}>{replaceVars(el.value, article)}</span>) : replaceVars(el.value, article))}
                      {isSelected && !isDragging && idx === 0 && selectedIds.length === 1 && (
                        <>
                          <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize z-[60]" onMouseDown={(e) => handleMouseDown(e, el, 'nw')} />
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-[60]" onMouseDown={(e) => handleMouseDown(e, el, 'se')} />
                        </>
                      )}
                    </div>
                  ));
              })}
           </div>
           <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase z-50 shadow-xl">
              <div className="flex items-center gap-3 w-32">
                <Maximize size={12} className="text-slate-300" />
                <input type="range" min="0.2" max="2" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <button onClick={() => setZoom(0.75)} className={`transition-colors ${zoom === 0.75 ? 'text-blue-600' : 'hover:text-slate-900'}`}>75%</button>
              <button onClick={() => setZoom(1)} className={`transition-colors ${zoom === 1 ? 'text-blue-600' : 'hover:text-slate-900'}`}>100%</button>
              <button onClick={handleFit} className="hover:text-slate-900 transition-colors">Ajuster</button>
              <div className="w-px h-4 bg-slate-200" />
              <span className="text-blue-600 w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
            </div>
            {selectedIds.length > 1 && (
              <div className="absolute top-8 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in zoom-in-95 duration-200 z-[100]">
                <span className="text-[10px] font-black uppercase tracking-widest border-r border-blue-400 pr-4">{selectedIds.length} sélectionnés</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => alignElements('left')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignLeft size={18} /></button>
                  <button onClick={() => alignElements('centerX')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignHorizontalDistributeCenter size={18} /></button>
                  <button onClick={() => alignElements('right')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignRight size={18} /></button>
                  <div className="w-px h-4 bg-blue-400" />
                  <button onClick={() => alignElements('top')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignVerticalJustifyStart size={18} /></button>
                  <button onClick={() => alignElements('centerY')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignVerticalDistributeCenter size={18} /></button>
                  <button onClick={() => alignElements('bottom')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors"><AlignVerticalJustifyEnd size={18} /></button>
                </div>
              </div>
            )}
        </main>

        <aside className="w-80 bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col gap-10 shadow-sm overflow-y-auto">
            {selectedElement ? (
               <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">Propriétés <Settings2 size={14} /></h3>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100">{selectedElement.type}</span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">ID: {selectedElement.id}</span>
                       </div>
                       <div className="flex gap-1">
                         <button onClick={bringToFront} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 border border-slate-100"><ArrowUp size={14} /></button>
                         <button onClick={sendToBack} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 border border-slate-100"><ArrowDown size={14} /></button>
                       </div>
                     </div>
                  </div>
                  <div className="space-y-6">
                     {selectedElement.type === 'VARIABLE' ? (
                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Donnée</label>
                         <select value={selectedElement.value} onChange={e => updateElement(selectedElement.id, { value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500">
                           {VARIABLES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                         </select>
                       </div>
                     ) : selectedElement.type === 'IMAGE' ? (
                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image</label>
                         <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 border border-blue-200 border-dashed"><Upload size={14} /> Choisir</button>
                       </div>
                     ) : selectedElement.type !== 'RECT' ? (
                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenu</label>
                         <textarea value={selectedElement.value} onChange={e => updateElement(selectedElement.id, { value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 min-h-[80px]" />
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
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400">Taille</label>
                             <input type="number" value={selectedElement.style.fontSize} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) || 12 }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400">Police</label>
                             <select value={selectedElement.style.fontFamily} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontFamily: e.target.value }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold">
                               {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400">Couleur Texte</label>
                          <input type="color" value={selectedElement.style.color} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value }})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400">Alignement</label>
                          <div className="flex bg-slate-100 p-1 rounded-xl">
                             <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'left' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'left' ? 'bg-white shadow-sm' : ''}`}>Gauche</button>
                             <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'center' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'center' ? 'bg-white shadow-sm' : ''}`}>Centre</button>
                             <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'right' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedElement.style.textAlign === 'right' ? 'bg-white shadow-sm' : ''}`}>Droite</button>
                          </div>
                       </div>
                       {(selectedElement.type === 'VARIABLE' || selectedElement.type === 'TEXT') && (
                         <div className="space-y-4 pt-4 border-t border-slate-100">
                           <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" checked={selectedElement.isArticleRepeated} onChange={e => updateElement(selectedElement.id, { isArticleRepeated: e.target.checked })} className="rounded text-blue-600" />
                              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-blue-600 tracking-widest">Répétition Article</span>
                           </label>
                           {selectedElement.isArticleRepeated && (
                             <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400">Pas Vertical (Pixels)</label>
                                <input type="number" value={selectedElement.verticalPitch} onChange={e => updateElement(selectedElement.id, { verticalPitch: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" />
                             </div>
                           )}
                         </div>
                       )}
                       <div className="space-y-4 pt-4 border-t border-slate-100">
                         <label className="text-[9px] font-bold text-slate-400">Fond</label>
                         <div className="flex items-center gap-3">
                            <input type="color" value={selectedElement.style.backgroundColor} disabled={selectedElement.style.noBackground} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value }})} className="flex-1 h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-30" />
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={selectedElement.style.noBackground} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, noBackground: e.target.checked }})} className="rounded text-blue-600" />
                              <span className="text-[10px] font-black uppercase text-slate-400">Aucun</span>
                            </label>
                         </div>
                       </div>
                       {selectedElement.type === 'RECT' && (
                         <div className="space-y-4 pt-4 border-t border-slate-100">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bordure</h4>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400">Épaisseur</label>
                                <input type="number" value={selectedElement.style.borderWidth} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, borderWidth: parseInt(e.target.value) || 0 }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400">Style</label>
                                <select value={selectedElement.style.borderStyle} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, borderStyle: e.target.value as any }})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold">
                                  <option value="solid">Plein</option>
                                  <option value="dashed">Pointillés</option>
                                  <option value="dotted">Points</option>
                                  <option value="double">Double</option>
                                </select>
                             </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400">Couleur</label>
                              <input type="color" value={selectedElement.style.borderColor} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, borderColor: e.target.value }})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" />
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
                  <button onClick={() => deleteElement(selectedElement.id)} className="w-full mt-6 py-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Supprimer
                  </button>
               </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-slate-300">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Move size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucune sélection</p>
                  <p className="text-[9px] font-bold mt-1">Cliquez sur un élément</p>
                </div>
              </div>
            )}
         </aside>
      </div>

      <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportTemplate} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || selectedIds.length === 0) return;
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await axios.post('/api/upload', formData);
            updateElement(selectedIds[0], { value: res.data.url });
          } catch (err) {
            alert('Erreur lors du téléchargement');
          }
        }}
      />
    </div>
  );
}
