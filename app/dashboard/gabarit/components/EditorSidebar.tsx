import React from 'react';
import { Type, Database, Square, Image as ImageIcon, Layers, Trash2 } from 'lucide-react';
import { Element } from '../types';

interface Props {
  elements: Element[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addElement: (type: Element['type']) => void;
  deleteElement: (id: string) => void;
}

export default function EditorSidebar({
  elements,
  selectedIds,
  setSelectedIds,
  addElement,
  deleteElement
}: Props) {
  return (
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
            <div 
              key={el.id} 
              onClick={(e) => { 
                if (e.shiftKey || e.ctrlKey || e.metaKey) { 
                  setSelectedIds(selectedIds.includes(el.id) ? selectedIds.filter(id => id !== el.id) : [...selectedIds, el.id]); 
                } else { 
                  setSelectedIds([el.id]); 
                } 
              }} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedIds.includes(el.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-50 hover:bg-slate-50'}`}
            >
              <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">{i + 1}</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-900 uppercase truncate">{el.type === 'VARIABLE' ? el.value : (el.value || el.type)}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} 
                className="p-1.5 text-slate-300 hover:text-rose-500"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
