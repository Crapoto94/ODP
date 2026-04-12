import React from 'react';
import { ChevronLeft, ChevronDown, Plus, Trash2, Copy, LayoutDashboard, Maximize, Save, Download, Upload, Loader2, AlignLeft, AlignHorizontalDistributeCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalDistributeCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import Link from 'next/link';

interface Props {
  gabaritId: number | null;
  gabaritNom: string;
  setGabaritNom: (nom: string) => void;
  isDefault: boolean;
  setIsDefault: (val: boolean) => void;
  isListOpen: boolean;
  setIsListOpen: (val: boolean) => void;
  allGabarits: any[];
  loadGabarit: (g: any) => void;
  handleDeleteGabarit: (id: number) => void;
  createNewGabarit: () => void;
  handleDuplicate: () => void;
  handleSave: () => void;
  handleExportTemplate: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  saving: boolean;
  isPreview: boolean;
  setIsPreview: (val: boolean) => void;
  selectedIds: string[];
  alignElements: (side: any) => void;
}

export default function EditorToolbar({
  gabaritId,
  gabaritNom,
  setGabaritNom,
  isDefault,
  setIsDefault,
  isListOpen,
  setIsListOpen,
  allGabarits,
  loadGabarit,
  handleDeleteGabarit,
  createNewGabarit,
  handleDuplicate,
  handleSave,
  handleExportTemplate,
  importInputRef,
  saving,
  isPreview,
  setIsPreview,
  selectedIds,
  alignElements
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nom du gabarit</span>
                  <input value={gabaritNom} onChange={e => setGabaritNom(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black text-slate-900 uppercase tracking-widest outline-none focus:border-blue-500 transition-colors w-64" placeholder="Nom du gabarit..." />
                </div>
                <label className="flex items-center gap-2 cursor-pointer group mt-4">
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Défaut</span>
                </label>
              </div>
            </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
           <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block" />
           <button onClick={handleExportTemplate} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm" title="Exporter (JSON)">
             <Download size={18} />
           </button>
           <button onClick={() => importInputRef.current?.click()} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm" title="Importer (JSON)">
             <Upload size={18} />
           </button>
        </div>
      </div>

      {selectedIds.length > 1 && (
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 z-[100]">
          <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} éléments sélectionnés</span>
          <div className="flex items-center gap-2">
            <button onClick={() => alignElements('left')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Aligner Gauche"><AlignLeft size={18} /></button>
            <button onClick={() => alignElements('centerX')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Centrer Horizontalement"><AlignHorizontalDistributeCenter size={18} /></button>
            <button onClick={() => alignElements('right')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Aligner Droite"><AlignRight size={18} /></button>
            <div className="w-px h-4 bg-blue-400 mx-1" />
            <button onClick={() => alignElements('top')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Aligner Haut"><AlignVerticalJustifyStart size={18} /></button>
            <button onClick={() => alignElements('centerY')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Centrer Verticalement"><AlignVerticalDistributeCenter size={18} /></button>
            <button onClick={() => alignElements('bottom')} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Aligner Bas"><AlignVerticalJustifyEnd size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
