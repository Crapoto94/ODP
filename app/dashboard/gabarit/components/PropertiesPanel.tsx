import React, { useRef, useEffect } from 'react';
import { Settings2, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { Element, VARIABLES, FONTS } from '../types';

interface Props {
  elements: Element[];
  selectedElement: Element | null;
  selectedIds: string[];
  updateElement: (id: string, updates: Partial<Element>) => void;
  updateMultipleElements: (ids: string[], updates: Partial<Element>) => void;
  bringToFront: () => void;
  sendToBack: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function PropertiesPanel({
  elements,
  selectedElement,
  selectedIds,
  updateElement,
  updateMultipleElements,
  bringToFront,
  sendToBack,
  fileInputRef
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const getCommonValue = (path: string) => {
    const selectedEntries = elements.filter(el => selectedIds.includes(el.id));
    if (selectedEntries.length === 0) return '';
    
    // Simple deep access
    const parts = path.split('.');
    const getValue = (obj: any) => parts.reduce((acc, part) => acc?.[part], obj);
    
    const firstVal = getValue(selectedEntries[0]);
    const allSame = selectedEntries.every(el => getValue(el) === firstVal);
    
    return allSame ? firstVal : '';
  };



  if (selectedIds.length > 1) {
    const commonSize = getCommonValue('style.fontSize');
    const commonFont = getCommonValue('style.fontFamily');
    const commonColor = getCommonValue('style.color');
    const commonAlign = getCommonValue('style.textAlign');
    const commonBg = getCommonValue('style.backgroundColor');
    const commonNoBg = getCommonValue('style.noBackground');
    const commonWeight = getCommonValue('style.fontWeight');
    const commonFontStyle = getCommonValue('style.fontStyle');
    const commonDecor = getCommonValue('style.textDecoration');

    const toggleMultiFormat = (type: 'bold' | 'italic' | 'underline') => {
      const selectedEntries = elements.filter(el => selectedIds.includes(el.id));
      selectedEntries.forEach(el => {
        let updates: any = { style: { ...el.style } };
        if (type === 'bold') {
          updates.style.fontWeight = commonWeight === 'bold' ? 'normal' : 'bold';
        } else if (type === 'italic') {
          updates.style.fontStyle = commonFontStyle === 'italic' ? 'normal' : 'italic';
        } else if (type === 'underline') {
          updates.style.textDecoration = commonDecor === 'underline' ? 'none' : 'underline';
        }
        updateElement(el.id, updates);
      });
    };

    return (
      <aside className="w-80 bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
        <div className="space-y-10">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">Multi-sélection <Settings2 size={14} /></h3>
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 uppercase">{selectedIds.length} Éléments</span>
                <div className="flex gap-1">
                  <button onClick={bringToFront} className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm"><ArrowUp size={12} /></button>
                  <button onClick={sendToBack} className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm"><ArrowDown size={12} /></button>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Groupé</h4>
            
            <div className="space-y-4">
               <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => toggleMultiFormat('bold')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${commonWeight === 'bold' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >Gras</button>
                  <button 
                    onClick={() => toggleMultiFormat('italic')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black italic transition-all ${commonFontStyle === 'italic' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >Ital</button>
                  <button 
                    onClick={() => toggleMultiFormat('underline')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black underline transition-all ${commonDecor === 'underline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >Soul</button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-bold text-slate-400">Taille</label>
                   <input 
                     type="number" 
                     value={commonSize || ''} 
                     placeholder={commonSize === '' ? 'Mixte' : ''}
                     onChange={e => updateMultipleElements(selectedIds, { style: { fontSize: parseInt(e.target.value) || 12 }})} 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold transition-all focus:bg-white focus:border-blue-500 outline-none" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-bold text-slate-400">Police</label>
                   <select 
                     value={commonFont || ''} 
                     onChange={e => updateMultipleElements(selectedIds, { style: { fontFamily: e.target.value }})} 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-blue-500"
                   >
                     <option value="" disabled>{commonFont === '' ? 'Mixte' : 'Choisir'}</option>
                     {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                   </select>
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400">Couleur</label>
              <input 
                type="color" 
                value={commonColor || '#000000'} 
                onChange={e => updateMultipleElements(selectedIds, { style: { color: e.target.value }})} 
                className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400">Alignement</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['left', 'center', 'right'].map((align) => (
                  <button 
                    key={align}
                    onClick={() => updateMultipleElements(selectedIds, { style: { textAlign: align as any }})} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${commonAlign === align ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {align === 'left' ? 'Gauche' : align === 'center' ? 'Centre' : 'Droite'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[9px] font-bold text-slate-400">Arrière-plan</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={commonBg || '#ffffff'} 
                  disabled={!!commonNoBg}
                  onChange={e => updateMultipleElements(selectedIds, { style: { backgroundColor: e.target.value }})} 
                  className="flex-1 h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-30" 
                />
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={!!commonNoBg} 
                    onChange={e => updateMultipleElements(selectedIds, { style: { noBackground: e.target.checked }})} 
                    className="rounded text-blue-600" 
                  />
                  <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Aucun</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 italic text-center">
              Les modifications s'appliquent à tous les éléments sélectionnés.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (!selectedElement) {
    return (
      <aside className="w-80 bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center gap-4 shadow-sm opacity-50">
        <Settings2 size={40} className="text-slate-200" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sélectionnez un élément pour voir ses propriétés</p>
      </aside>
    );
  }

    const toggleFormat = (type: 'bold' | 'italic' | 'underline') => {
      if (!selectedElement) return;
      let updates: any = { style: { ...selectedElement.style } };
      if (type === 'bold') {
        updates.style.fontWeight = selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold';
      } else if (type === 'italic') {
        updates.style.fontStyle = selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
      } else if (type === 'underline') {
        updates.style.textDecoration = selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline';
      }
      updateElement(selectedElement.id, updates);
    };

    return (
      <aside className="w-80 bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col gap-10 shadow-sm overflow-y-auto">
        <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">Propriétés <Settings2 size={14} /></h3>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100">{selectedElement.type}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase truncate max-w-[80px]">ID: {selectedElement.id}</span>
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
             ) : selectedElement.type === 'TEXT' ? (
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenu</label>
                  <textarea 
                    value={selectedElement.value} 
                    onChange={e => updateElement(selectedElement.id, { value: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 min-h-[100px] overflow-y-auto"
                  />
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
  
             <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">Styles du bloc</h4>
              
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => toggleFormat('bold')} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedElement.style.fontWeight === 'bold' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >Gras</button>
                    <button 
                      onClick={() => toggleFormat('italic')} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black italic transition-all ${selectedElement.style.fontStyle === 'italic' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >Ital</button>
                    <button 
                      onClick={() => toggleFormat('underline')} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black underline transition-all ${selectedElement.style.textDecoration === 'underline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >Soul</button>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400">Taille</label>
                  <input 
                    type="number" 
                    value={selectedElement.style.fontSize} 
                    onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) || 12 }})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold transition-all focus:bg-white focus:border-blue-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400">Police</label>
                  <select 
                    value={selectedElement.style.fontFamily} 
                    onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontFamily: e.target.value }})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-blue-500"
                  >
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400">Couleur Texte</label>
                <input type="color" value={selectedElement.style.color} onChange={e => updateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value }})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400">Alignement</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'left' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedElement.style.textAlign === 'left' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Gauche</button>
                   <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'center' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedElement.style.textAlign === 'center' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Centre</button>
                   <button onClick={() => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'right' }})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedElement.style.textAlign === 'right' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Droite</button>
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
      </div>
    </aside>
  );
}
